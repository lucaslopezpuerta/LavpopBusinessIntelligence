"""
Bilavnova POS Automation v3.15

CAPTCHA Solving Modes:
- PROXY MODE: Uses residential proxy (DataImpulse) for both CapSolver and Selenium
  - CapSolver task type: ReCaptchaV2Task (with proxy parameter)
  - More reliable, avoids geo-blocking
  - Requires PROXY_STRING env var and pos_use_proxy=true in Supabase

- PROXYLESS MODE: Direct connection without proxy
  - CapSolver task type: ReCaptchaV2TaskProxyLess
  - Faster, but may fail if IP is blocked or non-Brazilian
  - Used when PROXY_STRING not set OR pos_use_proxy=false in Supabase

Features:
- Cookie persistence for session reuse
- Automatic CSV export (sales + customers)
- Supabase upload with computed fields
- Traffic optimization (block images, CSS, fonts when using proxy)
- selenium-wire for headless proxy auth (GitHub Actions compatible)
- CLI: --headed, --headless, --sales-only, --customers-only, --upload-only
- Chrome background processes disabled to prevent login interference
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import requests
import time, os, logging, glob, re, random, pickle
from urllib.parse import urlparse

# Try selenium-wire first (better proxy support), fall back to regular selenium
SELENIUM_WIRE = False
SELENIUM_WIRE_ERROR = None
try:
    from seleniumwire import webdriver
    SELENIUM_WIRE = True
except ImportError as e:
    SELENIUM_WIRE_ERROR = str(e)
    from selenium import webdriver
except Exception as e:
    SELENIUM_WIRE_ERROR = str(e)
    from selenium import webdriver

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

VERSION = "3.15"
COOKIE_FILE = "pos_session_cookies.pkl"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pos_automation.log', encoding='utf-8'),
        logging.StreamHandler(open(1, 'w', encoding='utf-8', closefd=False))
    ]
)


class CapSolverAPI:
    """CapSolver API for reCAPTCHA v2"""

    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.capsolver.com"

    def solve_recaptcha_v2(self, sitekey, url, proxy=None):
        task_type = "ReCaptchaV2Task" if proxy else "ReCaptchaV2TaskProxyLess"
        task = {"type": task_type, "websiteURL": url, "websiteKey": sitekey}
        if proxy:
            task["proxy"] = proxy

        logging.info(f"Solving CAPTCHA ({task_type})...")
        response = requests.post(f"{self.base_url}/createTask", json={
            "clientKey": self.api_key, "task": task
        })
        result = response.json()

        if result.get("errorId", 1) != 0:
            raise Exception(f"CapSolver error: {result.get('errorDescription')}")

        task_id = result.get("taskId")
        if not task_id:
            raise Exception("No taskId received")

        for attempt in range(40):
            time.sleep(3)
            poll = requests.post(f"{self.base_url}/getTaskResult", json={
                "clientKey": self.api_key, "taskId": task_id
            }).json()

            if poll.get("status") == "ready":
                logging.info(f"CAPTCHA solved in {(attempt + 1) * 3}s")
                return poll.get("solution", {})
            elif poll.get("status") == "failed" or poll.get("errorId", 0) != 0:
                raise Exception(f"Task failed: {poll.get('errorDescription')}")

        raise Exception("CAPTCHA timeout after 120s")


class SupabaseUploader:
    """Wrapper for supabase_uploader module"""

    def __init__(self):
        self._available = False
        try:
            from supabase_client import get_supabase_client
            self._available = get_supabase_client() is not None
        except ImportError:
            pass

    def is_available(self):
        return self._available

    def upload_sales_csv(self, filepath):
        if not self._available:
            return False
        try:
            from supabase_uploader import upload_sales_csv
            result = upload_sales_csv(filepath, source='automated_upload')
            logging.info(f"Sales: {result['inserted']} inserted, {result['skipped']} skipped")
            return result['success']
        except Exception as e:
            logging.error(f"Sales upload failed: {e}")
            return False

    def upload_customers_csv(self, filepath):
        if not self._available:
            return False
        try:
            from supabase_uploader import upload_customers_csv
            result = upload_customers_csv(filepath, source='automated_upload')
            logging.info(f"Customers: {result['inserted']} inserted, {result['updated']} updated")
            return result['success']
        except Exception as e:
            logging.error(f"Customer upload failed: {e}")
            return False

    def refresh_metrics(self):
        if not self._available:
            return
        try:
            from supabase_uploader import refresh_customer_metrics
            refresh_customer_metrics()
        except:
            pass


class BilavnovaAutomation:
    def __init__(self, headless=True):
        self.headless = headless
        self.download_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(self.download_dir, exist_ok=True)

        capsolver_key = os.getenv('CAPSOLVER_API_KEY')
        if not capsolver_key:
            raise Exception("CAPSOLVER_API_KEY not set")
        self.capsolver = CapSolverAPI(capsolver_key)

        # =====================================================================
        # MODE SELECTION: Proxy vs ProxyLess
        # =====================================================================
        # 1. Check Supabase setting (pos_use_proxy in app_settings table)
        # 2. Check if PROXY_STRING environment variable is set
        # 3. If both conditions met → PROXY MODE, otherwise → PROXYLESS MODE
        # =====================================================================

        proxy_setting = self._get_proxy_setting()  # From Supabase (default: True)
        proxy_str = os.getenv('PROXY_STRING')      # From environment

        # Determine mode based on both conditions
        if proxy_str and proxy_setting:
            # PROXY MODE: Both PROXY_STRING set AND pos_use_proxy=true
            p = urlparse(proxy_str)
            self.proxy_host = p.hostname
            self.proxy_port = p.port
            self.proxy_user = p.username
            self.proxy_pass = p.password
            self.proxy_capsolver = proxy_str
            self.mode = "PROXY"
        else:
            # PROXYLESS MODE: Either PROXY_STRING not set OR pos_use_proxy=false
            self.proxy_host = None
            self.proxy_port = None
            self.proxy_user = None
            self.proxy_pass = None
            self.proxy_capsolver = None
            self.mode = "PROXYLESS"

        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')

        if not all([self.pos_url, self.username, self.password]):
            raise Exception("POS credentials not configured")

        self.sales_url = "https://lavpop.maxpan.com.br/system/sale"
        self.customer_url = "https://lavpop.maxpan.com.br/system/customer"
        self.supabase = SupabaseUploader()
        self.driver = None

        # =====================================================================
        # STARTUP LOG: Explicit mode announcement
        # =====================================================================
        logging.info("=" * 60)
        logging.info(f"Bilavnova POS Automation v{VERSION}")
        logging.info("=" * 60)
        logging.info(f"Browser: {'Headless' if headless else 'Headed'}")
        logging.info(f"Supabase: {'Connected' if self.supabase.is_available() else 'Not available'}")

        if self.mode == "PROXY":
            logging.info(f"Mode: PROXY (ReCaptchaV2Task)")
            logging.info(f"  - Proxy: {self.proxy_host}:{self.proxy_port}")
            logging.info(f"  - selenium-wire: {'Available' if SELENIUM_WIRE else 'Not available (fallback to extension)'}")
            logging.info(f"  - Traffic optimization: Enabled (blocking images, CSS, fonts)")
        else:
            logging.info(f"Mode: PROXYLESS (ReCaptchaV2TaskProxyLess)")
            if proxy_str and not proxy_setting:
                logging.info(f"  - Reason: pos_use_proxy=false in Supabase")
            elif not proxy_str:
                logging.info(f"  - Reason: PROXY_STRING not set")
        logging.info("=" * 60)

    def _get_proxy_setting(self):
        """
        Fetch pos_use_proxy setting from Supabase app_settings table.
        Returns True (use proxy) or False (proxyless).
        Defaults to True if Supabase unavailable or setting not found.
        """
        try:
            from supabase_client import get_supabase_client
            client = get_supabase_client()
            if not client:
                return True  # Default: use proxy

            result = client.table('app_settings').select('pos_use_proxy').eq('id', 'default').single().execute()
            if result.data and 'pos_use_proxy' in result.data:
                return result.data['pos_use_proxy']

            return True  # Default: use proxy
        except Exception:
            return True  # Default: use proxy on error

    def verify_proxy_ip(self):
        """Verify browser IP address (should show proxy IP in PROXY mode)"""
        try:
            self.driver.get('https://api.ipify.org?format=json')
            time.sleep(2)
            body = self.driver.find_element(By.TAG_NAME, 'body').text
            import json
            ip = json.loads(body).get('ip', 'Unknown')
            logging.info(f"Browser IP: {ip}")
            return ip
        except Exception as e:
            logging.warning(f"IP verification failed: {e}")
            return None

    def setup_driver(self):
        opts = Options()
        if self.headless:
            opts.add_argument('--headless=new')

        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--window-size=1920,1080')
        opts.add_argument('--disable-gpu')
        # Disable background processes that can interfere with automation
        opts.add_argument('--disable-component-update')
        opts.add_argument('--disable-background-networking')
        opts.add_argument('--disable-sync')
        opts.add_argument('--disable-default-apps')
        opts.add_argument('--disable-extensions')
        opts.add_argument('--disable-background-timer-throttling')
        opts.add_argument('--disable-backgrounding-occluded-windows')
        opts.add_argument('--disable-renderer-backgrounding')
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)
        opts.add_argument('--disable-blink-features=AutomationControlled')
        opts.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        abs_download_dir = os.path.abspath(self.download_dir)
        os.makedirs(abs_download_dir, exist_ok=True)

        prefs = {
            "download.default_directory": abs_download_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
            "profile.default_content_settings.popups": 0,
            "profile.default_content_setting_values.automatic_downloads": 1
        }

        # PROXY MODE: Block images to save bandwidth
        if self.mode == "PROXY":
            prefs["profile.managed_default_content_settings.images"] = 2

        opts.add_experimental_option("prefs", prefs)

        # DRIVER CREATION: Different setup for PROXY vs PROXYLESS
        if self.mode == "PROXY" and SELENIUM_WIRE:
            # PROXY MODE with selenium-wire (supports authenticated proxies in headless)
            proxy_url = f'http://{self.proxy_user}:{self.proxy_pass}@{self.proxy_host}:{self.proxy_port}'
            seleniumwire_options = {
                'proxy': {
                    'http': proxy_url,
                    'https': proxy_url,
                    'no_proxy': 'localhost,127.0.0.1'
                },
                'connection_timeout': 30,
                'request_timeout': 60,
                'verify_ssl': False
            }
            driver = webdriver.Chrome(options=opts, seleniumwire_options=seleniumwire_options)
        else:
            # PROXYLESS MODE (or PROXY without selenium-wire)
            driver = webdriver.Chrome(options=opts)

        driver.set_page_load_timeout(120)
        driver.implicitly_wait(10)

        # Anti-detection measures
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                window.chrome = {runtime: {}};
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            '''
        })

        # PROXY MODE: Block fonts, CSS, media to save bandwidth
        if self.mode == "PROXY":
            try:
                driver.execute_cdp_cmd('Network.enable', {})
                driver.execute_cdp_cmd('Network.setBlockedURLs', {
                    'urls': [
                        '*.woff', '*.woff2', '*.ttf', '*.eot',  # fonts
                        '*.css',  # CSS
                        '*.mp4', '*.webm', '*.mp3',  # media
                        '*google-analytics*', '*gtag*', '*facebook*', '*hotjar*'  # tracking
                    ]
                })
            except Exception:
                pass  # CDP blocking not critical

        try:
            driver.execute_cdp_cmd('Browser.setDownloadBehavior', {
                'behavior': 'allow',
                'downloadPath': abs_download_dir,
                'eventsEnabled': True
            })
        except:
            try:
                driver.execute_cdp_cmd('Page.setDownloadBehavior', {
                    'behavior': 'allow',
                    'downloadPath': abs_download_dir
                })
            except:
                pass

        self.abs_download_dir = abs_download_dir
        return driver

    def save_cookies(self):
        try:
            with open(COOKIE_FILE, 'wb') as f:
                pickle.dump(self.driver.get_cookies(), f)
        except:
            pass

    def load_cookies(self):
        if not os.path.exists(COOKIE_FILE):
            return False
        try:
            self.driver.get(self.pos_url)
            time.sleep(1)
            with open(COOKIE_FILE, 'rb') as f:
                for cookie in pickle.load(f):
                    try:
                        self.driver.add_cookie(cookie)
                    except:
                        pass
            return True
        except:
            return False

    def is_session_valid(self):
        try:
            self.driver.get(self.sales_url)
            time.sleep(3)
            if "system" in self.driver.current_url:
                if not self.driver.find_elements(By.CSS_SELECTOR, 'input[name="email"]'):
                    return True
            return False
        except:
            return False

    def fill_credentials(self):
        email = self.driver.find_element(By.CSS_SELECTOR, 'input[name="email"]')
        password = self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        email.clear()
        for char in self.username:
            email.send_keys(char)
            time.sleep(random.uniform(0.05, 0.1))
        time.sleep(0.3)
        password.clear()
        for char in self.password:
            password.send_keys(char)
            time.sleep(random.uniform(0.05, 0.1))

    def extract_sitekey(self):
        for iframe in self.driver.find_elements(By.TAG_NAME, "iframe"):
            src = iframe.get_attribute("src") or ""
            if "recaptcha" in src and "k=" in src:
                return src.split("k=")[1].split("&")[0]
        return None

    def login_with_captcha(self):
        self.driver.get(self.pos_url)
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="email"]'))
        )
        time.sleep(random.uniform(1, 2))

        self.fill_credentials()

        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'iframe[src*="recaptcha"]'))
        )

        sitekey = self.extract_sitekey()
        if not sitekey:
            raise Exception("Could not extract sitekey")

        solution = self.capsolver.solve_recaptcha_v2(sitekey, self.driver.current_url, self.proxy_capsolver)
        token = solution.get("gRecaptchaResponse")
        if not token:
            raise Exception("No token in solution")

        self.driver.execute_script(f'''
            var token = "{token}";
            var ta = document.getElementById("g-recaptcha-response");
            if (ta) {{ ta.value = token; ta.innerHTML = token; }}
            if (typeof grecaptcha !== 'undefined') {{
                grecaptcha.getResponse = function() {{ return token; }};
            }}
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var clients = ___grecaptcha_cfg.clients;
                var visited = new WeakSet();
                for (var cid in clients) {{
                    (function find(obj, depth) {{
                        if (!obj || typeof obj !== 'object' || depth > 5 || visited.has(obj)) return;
                        visited.add(obj);
                        for (var k in obj) {{
                            if (k === 'callback' && typeof obj[k] === 'function') obj[k](token);
                            else if (typeof obj[k] === 'object') find(obj[k], depth + 1);
                        }}
                    }})(clients[cid], 0);
                }}
            }}
        ''')

        time.sleep(0.5)
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]").click()

        for _ in range(8):
            time.sleep(1)
            if "system" in self.driver.current_url:
                return True
        return False

    def login(self):
        logging.info("Logging in...")

        # PROXY MODE: Verify we're using the proxy IP
        if self.mode == "PROXY":
            self.verify_proxy_ip()

        if self.load_cookies() and self.is_session_valid():
            logging.info("Session restored from cookies")
            return True

        for attempt in range(3):
            try:
                if self.login_with_captcha():
                    logging.info("Login successful")
                    self.save_cookies()
                    return True
            except Exception as e:
                logging.warning(f"Login attempt {attempt + 1} failed: {e}")
            if attempt < 2:
                time.sleep(5)
        return False

    def simulate_click(self, element):
        """MouseEvent dispatch for React components"""
        self.driver.execute_script('''
            var element = arguments[0];
            ['mousedown', 'mouseup', 'click'].forEach(function(eventType) {
                element.dispatchEvent(new MouseEvent(eventType, {
                    view: window, bubbles: true, cancelable: true, buttons: 1
                }));
            });
        ''', element)

    def select_store(self):
        """Select CAXIAS DO SUL store"""
        for attempt in range(3):
            try:
                dropdown = None
                for xpath in [
                    "//*[contains(text(), 'Selecione a loja')]/ancestor::div[contains(@class, 'control') or contains(@class, 'select')]",
                    "//*[contains(text(), 'Selecione a loja')]/..",
                    "//*[contains(text(), 'Selecione a loja')]"
                ]:
                    try:
                        dropdown = self.driver.find_element(By.XPATH, xpath)
                        break
                    except:
                        continue

                if not dropdown:
                    time.sleep(2)
                    continue

                self.simulate_click(dropdown)
                time.sleep(2)

                clicked = self.driver.execute_script('''
                    var opts = document.querySelectorAll('[id*="react-select"][id*="option"]');
                    for (var o of opts) {
                        if (o.textContent.includes('CAXIAS')) {
                            ['mousedown', 'mouseup', 'click'].forEach(function(e) {
                                o.dispatchEvent(new MouseEvent(e, {view: window, bubbles: true, cancelable: true, buttons: 1}));
                            });
                            return true;
                        }
                    }
                    return false;
                ''')

                if clicked:
                    time.sleep(1)
                    return True

            except Exception as e:
                logging.debug(f"Store selection attempt {attempt + 1} failed: {e}")
                time.sleep(2)
        return False

    def select_period_hoje(self):
        """Select 'Hoje' period"""
        try:
            self.driver.execute_script('''
                var labels = document.querySelectorAll('*');
                for (var el of labels) {
                    if (el.textContent && el.textContent.trim() === 'Período') {
                        var parent = el.closest('div');
                        if (parent) {
                            var inputs = parent.querySelectorAll('input, div[class*="select"], button');
                            for (var input of inputs) {
                                if (input.offsetParent !== null) { input.click(); return true; }
                            }
                        }
                    }
                }
                return false;
            ''')
            time.sleep(1.5)

            self.driver.execute_script('''
                var selectors = ["div[class*='popup'] div", "div[class*='dropdown'] div", "li", "button", "span"];
                for (var sel of selectors) {
                    for (var el of document.querySelectorAll(sel)) {
                        if (el.textContent.trim() === 'Hoje' && el.offsetParent !== null && !el.closest('[class*="chip"]')) {
                            el.click(); return true;
                        }
                    }
                }
                return false;
            ''')
            time.sleep(0.5)

            self.driver.execute_script('''
                for (var btn of document.querySelectorAll('button')) {
                    if (btn.textContent.includes('Aplicar') && btn.offsetParent !== null) {
                        btn.click(); return true;
                    }
                }
                return false;
            ''')
            time.sleep(1)
            return True
        except:
            return False

    def export_sales(self):
        logging.info("Exporting sales...")
        self.driver.get(self.sales_url)
        time.sleep(6)

        if "system" not in self.driver.current_url:
            raise Exception("Session expired")

        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Selecione a loja')]"))
        )

        self.select_store()
        self.select_period_hoje()

        # Click Buscar
        self.driver.execute_script('''
            for (var btn of document.querySelectorAll('button')) {
                if (btn.textContent.includes('Buscar') && btn.offsetParent !== null && !btn.disabled) {
                    ['mousedown', 'mouseup', 'click'].forEach(function(e) {
                        btn.dispatchEvent(new MouseEvent(e, {view: window, bubbles: true, cancelable: true, buttons: 1}));
                    });
                    return;
                }
            }
        ''')
        time.sleep(5)

        # Click Exportar
        for _ in range(15):
            result = self.driver.execute_script('''
                for (var btn of document.querySelectorAll('button')) {
                    if (btn.textContent.toLowerCase().includes('exportar') && btn.offsetParent !== null) {
                        if (btn.disabled) return 'disabled';
                        btn.scrollIntoView({block: 'center'});
                        ['mousedown', 'mouseup', 'click'].forEach(function(e) {
                            btn.dispatchEvent(new MouseEvent(e, {view: window, bubbles: true, cancelable: true, buttons: 1}));
                        });
                        return 'clicked';
                    }
                }
                return 'not_found';
            ''')

            if result == 'clicked':
                return self.wait_for_download()
            elif result == 'disabled':
                logging.info("No sales data to export (button disabled)")
                return None
            time.sleep(1)

        raise Exception("Export button not available")

    def export_customers(self):
        logging.info("Exporting customers...")
        self.driver.get(self.customer_url)
        time.sleep(6)  # Match sales page load time

        if "system" not in self.driver.current_url:
            raise Exception("Session expired")

        # Wait for page to be fully loaded (same pattern as sales)
        try:
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "table"))
            )
        except:
            logging.warning("Could not find table, proceeding anyway...")

        time.sleep(2)  # Additional wait for React to render

        # Click Exportar - SAME PATTERN AS SALES (button only, case-insensitive)
        for _ in range(15):
            result = self.driver.execute_script('''
                for (var btn of document.querySelectorAll('button')) {
                    if (btn.textContent.toLowerCase().includes('exportar') && btn.offsetParent !== null) {
                        if (btn.disabled) return 'disabled';
                        btn.scrollIntoView({block: 'center'});
                        ['mousedown', 'mouseup', 'click'].forEach(function(e) {
                            btn.dispatchEvent(new MouseEvent(e, {view: window, bubbles: true, cancelable: true, buttons: 1}));
                        });
                        return 'clicked';
                    }
                }
                return 'not_found';
            ''')

            if result == 'clicked':
                logging.info("Export button clicked, waiting for download...")
                return self.wait_for_download(timeout=120)  # Increased timeout for larger customer export
            elif result == 'disabled':
                logging.info("No customer data to export (button disabled)")
                return None
            time.sleep(1)

        raise Exception("Customer export button not available")

    def wait_for_download(self, timeout=60):
        initial_files = set(os.listdir(self.download_dir)) if os.path.exists(self.download_dir) else set()

        start = time.time()
        while time.time() - start < timeout:
            if not os.path.exists(self.download_dir):
                time.sleep(1)
                continue

            new_files = set(os.listdir(self.download_dir)) - initial_files

            for filename in new_files:
                if filename.endswith(('.crdownload', '.tmp', '.part')):
                    continue

                filepath = os.path.join(self.download_dir, filename)
                try:
                    size = os.path.getsize(filepath)
                    if size == 0:
                        continue
                    time.sleep(1)
                    if os.path.getsize(filepath) != size:
                        continue

                    # Auto-rename UUID files to .csv
                    if not filename.endswith('.csv'):
                        with open(filepath, 'r', encoding='utf-8-sig') as f:
                            first_line = f.readline()
                            if ';' in first_line or ',' in first_line:
                                new_filepath = filepath + '.csv'
                                os.rename(filepath, new_filepath)
                                return new_filepath
                    return filepath
                except:
                    pass

            time.sleep(1)

        raise Exception(f"Download timeout after {timeout}s")

    def find_latest_csv(self, pattern):
        files = glob.glob(os.path.join(self.download_dir, f"*{pattern}*.csv"))
        return max(files, key=os.path.getmtime) if files else None

    def run(self):
        """Full automation: login, export, upload"""
        try:
            self.driver = self.setup_driver()
            if not self.login():
                raise Exception("Login failed")

            sales_file = self.export_sales()
            customer_file = self.export_customers()

            if self.supabase.is_available():
                if customer_file:
                    self.supabase.upload_customers_csv(customer_file)
                if sales_file:
                    self.supabase.upload_sales_csv(sales_file)
                self.supabase.refresh_metrics()

            logging.info("Automation completed")
            return True

        except Exception as e:
            logging.error(f"Automation failed: {e}")
            if self.driver:
                self.driver.save_screenshot("error.png")
            return False

        finally:
            if self.driver:
                self.driver.quit()

    def run_sales_only(self):
        try:
            self.driver = self.setup_driver()
            if not self.login():
                raise Exception("Login failed")

            sales_file = self.export_sales()
            if sales_file and self.supabase.is_available():
                self.supabase.upload_sales_csv(sales_file)
                self.supabase.refresh_metrics()

            logging.info("Sales sync completed")
            return True

        except Exception as e:
            logging.error(f"Sales sync failed: {e}")
            if self.driver:
                self.driver.save_screenshot("error_sales.png")
            return False

        finally:
            if self.driver:
                self.driver.quit()

    def run_customers_only(self):
        try:
            self.driver = self.setup_driver()
            if not self.login():
                raise Exception("Login failed")

            customer_file = self.export_customers()
            if customer_file and self.supabase.is_available():
                self.supabase.upload_customers_csv(customer_file)
                self.supabase.refresh_metrics()

            logging.info("Customer sync completed")
            return True

        except Exception as e:
            logging.error(f"Customer sync failed: {e}")
            if self.driver:
                self.driver.save_screenshot("error_customers.png")
            return False

        finally:
            if self.driver:
                self.driver.quit()

    def upload_existing_files(self):
        if not self.supabase.is_available():
            logging.error("Supabase not configured")
            return False

        try:
            sales_file = self.find_latest_csv('sale')
            customer_file = self.find_latest_csv('customer')

            if customer_file:
                self.supabase.upload_customers_csv(customer_file)
            if sales_file:
                self.supabase.upload_sales_csv(sales_file)
            if customer_file or sales_file:
                self.supabase.refresh_metrics()
                logging.info("Upload completed")
                return True
            else:
                logging.warning("No CSV files found")
                return False

        except Exception as e:
            logging.error(f"Upload failed: {e}")
            return False


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Bilavnova POS Automation')

    browser_group = parser.add_mutually_exclusive_group()
    browser_group.add_argument('--headed', action='store_true', help='Visible browser')
    browser_group.add_argument('--headless', action='store_true', help='Headless mode (default)')

    op_group = parser.add_mutually_exclusive_group()
    op_group.add_argument('--full', action='store_true', help='Full sync (default)')
    op_group.add_argument('--sales-only', action='store_true', help='Sales only')
    op_group.add_argument('--customers-only', action='store_true', help='Customers only')
    op_group.add_argument('--upload-only', action='store_true', help='Upload existing CSVs')

    args = parser.parse_args()
    headless = not args.headed

    automation = BilavnovaAutomation(headless=headless)

    if args.upload_only:
        result = automation.upload_existing_files()
    elif args.sales_only:
        result = automation.run_sales_only()
    elif args.customers_only:
        result = automation.run_customers_only()
    else:
        result = automation.run()

    exit(0 if result else 1)


if __name__ == "__main__":
    main()
