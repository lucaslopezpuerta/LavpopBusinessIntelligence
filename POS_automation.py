"""
Bilavnova POS Automation v3.21

CHANGELOG:
v3.21 (2026-02-04): Fix timezone handling for GitHub Actions
  - Set TZ=America/Sao_Paulo at script start for consistent behavior
  - Ensures uploaded data has correct Brazil timestamps regardless of server TZ

v3.20 (2025-12-27): Enhanced diagnostics for login failures
  - Add detailed form state logging at 5s mark (captcha token, errors, form validity)
  - Helps diagnose why login succeeds sometimes and fails other times
  - Logs whether email/password are still filled after button click

v3.19 (2025-12-27): Fix PROXYLESS mode reliability
  - CRITICAL: Only use selenium-wire in PROXY mode (removes local proxy overhead)
  - Dispatch input/change events after token injection for React state updates
  - Wait longer (1s) after CAPTCHA callback for React to process
  - Standard selenium in PROXYLESS = faster, more reliable, no request interception

v3.18 (2025-12-26): Fix form submission causing GET redirect
  - REMOVED form.submit() which was causing GET redirect with credentials in URL
  - Use requestSubmit() instead which respects React onSubmit handlers
  - Only use fallback form submission if button click failed

v3.17 (2025-12-26): Enhanced button detection
  - Add logging for all available buttons on login page
  - Try multiple button text patterns (Entrar, Login, Acessar)
  - Fallback to type="submit" buttons
  - Better logging to diagnose login failures

v3.16 (2025-12-26): Slow CAPTCHA handling
  - Detect when CAPTCHA solve takes >20s (token may be stale)
  - Verify page state before injecting token
  - Re-check sitekey to detect CAPTCHA iframe refresh
  - Use MouseEvent dispatch for more reliable button clicks
  - Track callback triggering success
  - Increased login wait timeout from 8s to 12s
  - Better error detection and logging

v3.15: Previous stable version

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

# CRITICAL: Set timezone to Brazil BEFORE any imports
# This ensures consistent behavior regardless of server timezone (UTC in GitHub Actions)
import os
import time as _time_module

os.environ['TZ'] = 'America/Sao_Paulo'
try:
    _time_module.tzset()  # Apply the timezone change (Unix only)
except AttributeError:
    pass  # Windows doesn't have tzset, but TZ env var is still set for child processes

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import requests
import time, os, logging, glob, re, random, pickle
from urllib.parse import urlparse

# Import selenium - only use selenium-wire when PROXY mode is needed
# selenium-wire adds overhead even in PROXYLESS mode (creates local proxy)
SELENIUM_WIRE = False
SELENIUM_WIRE_ERROR = None
_webdriver_module = None

def _get_webdriver(use_wire=False):
    """Get appropriate webdriver module based on mode."""
    global SELENIUM_WIRE, SELENIUM_WIRE_ERROR, _webdriver_module

    if use_wire and _webdriver_module is None:
        try:
            from seleniumwire import webdriver as wire_webdriver
            _webdriver_module = wire_webdriver
            SELENIUM_WIRE = True
        except ImportError as e:
            SELENIUM_WIRE_ERROR = str(e)
            from selenium import webdriver as std_webdriver
            _webdriver_module = std_webdriver
        except Exception as e:
            SELENIUM_WIRE_ERROR = str(e)
            from selenium import webdriver as std_webdriver
            _webdriver_module = std_webdriver
    elif not use_wire:
        from selenium import webdriver as std_webdriver
        _webdriver_module = std_webdriver
        SELENIUM_WIRE = False

    return _webdriver_module

# Default import for non-proxy mode
from selenium import webdriver

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

VERSION = "3.21"
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
                solve_time = (attempt + 1) * 3
                logging.info(f"CAPTCHA solved in {solve_time}s")
                solution = poll.get("solution", {})
                solution["_solve_time"] = solve_time  # Include solve time in response
                return solution
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
            logging.info(f"  - selenium-wire: Will be loaded on driver setup")
            logging.info(f"  - Traffic optimization: Enabled (blocking images, CSS, fonts)")
        else:
            logging.info(f"Mode: PROXYLESS (ReCaptchaV2TaskProxyLess)")
            logging.info(f"  - Driver: Standard selenium (no request interception)")
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
        if self.mode == "PROXY":
            # PROXY MODE: Use selenium-wire for authenticated proxy support
            wd = _get_webdriver(use_wire=True)
            if SELENIUM_WIRE:
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
                driver = wd.Chrome(options=opts, seleniumwire_options=seleniumwire_options)
            else:
                # Fallback if selenium-wire unavailable
                driver = wd.Chrome(options=opts)
        else:
            # PROXYLESS MODE: Use standard selenium (no overhead from selenium-wire proxy)
            wd = _get_webdriver(use_wire=False)
            driver = wd.Chrome(options=opts)

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
        """
        Login with CAPTCHA solving.
        v3.16: Added slow CAPTCHA detection and page state verification.
        """
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

        # Solve CAPTCHA and track time
        solution = self.capsolver.solve_recaptcha_v2(sitekey, self.driver.current_url, self.proxy_capsolver)
        token = solution.get("gRecaptchaResponse")
        solve_time = solution.get("_solve_time", 0)

        if not token:
            raise Exception("No token in solution")

        # v3.16: Warn if CAPTCHA took too long (token may be stale)
        if solve_time > 20:
            logging.warning(f"CAPTCHA solve took {solve_time}s - token may be stale, verifying page state...")

            # Check if page is still on login form
            if not self.driver.find_elements(By.CSS_SELECTOR, 'input[name="email"]'):
                logging.warning("Page changed during CAPTCHA solve, reloading...")
                raise Exception("Page state changed during slow CAPTCHA solve")

            # Re-extract sitekey to verify CAPTCHA iframe is still valid
            new_sitekey = self.extract_sitekey()
            if new_sitekey != sitekey:
                logging.warning(f"Sitekey changed ({sitekey} → {new_sitekey}), CAPTCHA may have refreshed")
                raise Exception("CAPTCHA refreshed during slow solve")

        # Inject token with enhanced callback triggering
        # v3.19: Also dispatch input event to trigger React's onChange handlers
        callback_triggered = self.driver.execute_script(f'''
            var token = "{token}";
            var callbackTriggered = false;

            // Set response textarea and dispatch events for React
            var ta = document.getElementById("g-recaptcha-response");
            if (ta) {{
                // Set value
                ta.value = token;
                ta.innerHTML = token;

                // Dispatch events that React listens to
                var inputEvent = new Event('input', {{ bubbles: true }});
                var changeEvent = new Event('change', {{ bubbles: true }});
                ta.dispatchEvent(inputEvent);
                ta.dispatchEvent(changeEvent);
            }}

            // Also set any hidden inputs with recaptcha in the name
            var hiddenInputs = document.querySelectorAll('input[name*="recaptcha"], input[name*="captcha"]');
            for (var input of hiddenInputs) {{
                input.value = token;
                input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                input.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}

            // Override getResponse
            if (typeof grecaptcha !== 'undefined') {{
                grecaptcha.getResponse = function() {{ return token; }};
            }}

            // Find and trigger callback - this tells React that CAPTCHA is complete
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var clients = ___grecaptcha_cfg.clients;
                var visited = new WeakSet();
                for (var cid in clients) {{
                    (function find(obj, depth) {{
                        if (!obj || typeof obj !== 'object' || depth > 5 || visited.has(obj)) return;
                        visited.add(obj);
                        for (var k in obj) {{
                            if (k === 'callback' && typeof obj[k] === 'function') {{
                                try {{
                                    obj[k](token);
                                    callbackTriggered = true;
                                }} catch(e) {{}}
                            }}
                            else if (typeof obj[k] === 'object') find(obj[k], depth + 1);
                        }}
                    }})(clients[cid], 0);
                }}
            }}

            return callbackTriggered;
        ''')

        if callback_triggered:
            logging.info("CAPTCHA callback triggered successfully")
        else:
            logging.warning("CAPTCHA callback not found - attempting button click fallback")

        # v3.19: Wait longer for React to process the callback and update state
        time.sleep(1.0)

        # v3.17: Enhanced button detection with logging
        button_info = self.driver.execute_script('''
            var buttons = document.querySelectorAll('button');
            var buttonTexts = [];
            for (var btn of buttons) {
                buttonTexts.push({
                    text: btn.textContent.trim().substring(0, 50),
                    visible: btn.offsetParent !== null,
                    disabled: btn.disabled,
                    type: btn.type
                });
            }
            return JSON.stringify(buttonTexts);
        ''')
        logging.info(f"Available buttons: {button_info}")

        # v3.17: Try multiple button selectors
        button_clicked = self.driver.execute_script('''
            var buttons = document.querySelectorAll('button');
            for (var btn of buttons) {
                var text = btn.textContent.toLowerCase();
                // Match various login button texts (Portuguese)
                if ((text.includes('entrar') || text.includes('login') || text.includes('acessar'))
                    && btn.offsetParent !== null && !btn.disabled) {
                    console.log('Clicking button:', btn.textContent);
                    ['mousedown', 'mouseup', 'click'].forEach(function(eventType) {
                        btn.dispatchEvent(new MouseEvent(eventType, {
                            view: window, bubbles: true, cancelable: true, buttons: 1
                        }));
                    });
                    return {clicked: true, text: btn.textContent.trim()};
                }
            }
            // Fallback: try submit buttons
            var submitBtns = document.querySelectorAll('button[type="submit"], input[type="submit"]');
            for (var btn of submitBtns) {
                if (btn.offsetParent !== null && !btn.disabled) {
                    console.log('Clicking submit button:', btn.textContent || btn.value);
                    ['mousedown', 'mouseup', 'click'].forEach(function(eventType) {
                        btn.dispatchEvent(new MouseEvent(eventType, {
                            view: window, bubbles: true, cancelable: true, buttons: 1
                        }));
                    });
                    return {clicked: true, text: btn.textContent || btn.value || 'submit'};
                }
            }
            return {clicked: false, text: null};
        ''')

        if button_clicked and button_clicked.get('clicked'):
            logging.info(f"Clicked button: '{button_clicked.get('text')}'")
        else:
            logging.warning("No suitable button found via JS")

        if not button_clicked or not button_clicked.get('clicked'):
            # Fallback to direct Selenium click
            logging.info("Trying direct Selenium click fallback...")
            try:
                # Try multiple XPath patterns
                for xpath in [
                    "//button[contains(text(), 'Entrar')]",
                    "//button[contains(text(), 'entrar')]",
                    "//button[contains(text(), 'Login')]",
                    "//button[@type='submit']",
                    "//input[@type='submit']"
                ]:
                    try:
                        btn = self.driver.find_element(By.XPATH, xpath)
                        btn.click()
                        logging.info(f"Clicked via XPath: {xpath}")
                        break
                    except:
                        continue
                else:
                    logging.warning("No button found via any XPath")
            except Exception as e:
                logging.warning(f"All button click methods failed: {e}")

        # v3.18: DO NOT call form.submit() - it causes GET redirect instead of POST
        # The button click above should trigger React's onSubmit handler
        # If button click didn't work, try requestSubmit() which respects form validation
        if not button_clicked or not button_clicked.get('clicked'):
            submit_result = self.driver.execute_script('''
                var forms = document.querySelectorAll('form');
                for (var form of forms) {
                    if (form.querySelector('input[name="email"]')) {
                        // Try requestSubmit (respects onSubmit handlers)
                        if (typeof form.requestSubmit === 'function') {
                            try {
                                form.requestSubmit();
                                return 'requestSubmit';
                            } catch(e) {}
                        }
                        // Fallback: find and click submit button
                        var submitBtn = form.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.click();
                            return 'submitBtnClick';
                        }
                    }
                }
                return null;
            ''')
            if submit_result:
                logging.info(f"Form submission via: {submit_result}")

        # Wait for redirect with longer timeout for slow connections
        logging.info("Waiting for login redirect...")
        for i in range(12):  # 12 seconds
            time.sleep(1)
            current_url = self.driver.current_url
            if "system" in current_url and ("/system/sale" in current_url or "/system/customer" in current_url or current_url.endswith("/system")):
                logging.info(f"Login redirect detected: {current_url}")
                return True

            # Check if still on login page (page may have reloaded)
            if self.driver.find_elements(By.CSS_SELECTOR, 'input[name="email"]'):
                if i == 5:  # Log once at halfway point
                    logging.info(f"Still on login page after {i}s: {current_url}")
                    # v3.20: Enhanced diagnostics - check form state
                    diag = self.driver.execute_script('''
                        var result = {};
                        // Check CAPTCHA token
                        var ta = document.getElementById("g-recaptcha-response");
                        result.captchaToken = ta ? (ta.value ? ta.value.substring(0,20) + '...' : 'EMPTY') : 'NOT_FOUND';
                        // Check for visible errors
                        var errors = document.querySelectorAll('.error, .alert, [class*="error"], [class*="invalid"]');
                        result.errors = [];
                        for (var e of errors) {
                            if (e.offsetParent && e.textContent.trim()) {
                                result.errors.push(e.textContent.trim().substring(0, 100));
                            }
                        }
                        // Check form validation state
                        var form = document.querySelector('form');
                        if (form) {
                            result.formValid = form.checkValidity();
                            var invalidInputs = form.querySelectorAll(':invalid');
                            result.invalidFields = [];
                            for (var inp of invalidInputs) {
                                result.invalidFields.push(inp.name || inp.id || inp.type);
                            }
                        }
                        // Check if email/password are filled
                        var emailInput = document.querySelector('input[name="email"]');
                        var passInput = document.querySelector('input[type="password"]');
                        result.emailFilled = emailInput ? (emailInput.value.length > 0) : false;
                        result.passFilled = passInput ? (passInput.value.length > 0) : false;
                        return result;
                    ''')
                    logging.info(f"Form diagnostics: {diag}")

        # v3.17: Log final state for debugging
        logging.warning(f"Login timeout - final URL: {self.driver.current_url}")

        # v3.16: Check if we got an error message
        error_elements = self.driver.find_elements(By.CSS_SELECTOR, '.error, .alert-danger, [class*="error"], .toast, .notification')
        for el in error_elements:
            if el.text.strip():
                logging.warning(f"Login error detected: {el.text.strip()}")

        # v3.17: Check if there's any toast/snackbar message
        toast_text = self.driver.execute_script('''
            var toasts = document.querySelectorAll('.Toastify, .toast, .snackbar, [class*="toast"], [class*="notification"]');
            var texts = [];
            for (var t of toasts) {
                if (t.textContent.trim()) texts.push(t.textContent.trim());
            }
            return texts.join(' | ');
        ''')
        if toast_text:
            logging.warning(f"Toast/notification: {toast_text}")

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
