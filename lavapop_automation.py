"""
Lavapop POS Automation v2.8
- BFT (Block Frame Token) extraction from reCAPTCHA iframe
- 6 data-s/bft extraction methods
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import requests
import json, time, os, logging, glob, re, random
from datetime import datetime, timedelta

VERSION = "2.8"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pos_automation.log'),
        logging.StreamHandler()
    ]
)

class CapSolverAPI:
    def __init__(self, api_key, use_proxy=False):
        self.api_key = api_key
        self.base_url = "https://api.capsolver.com"
        self.use_proxy = use_proxy
    
    def solve_recaptcha_v2_enterprise(self, sitekey, url, data_s=None, proxy=None):
        """
        Solve Enterprise reCAPTCHA with proper configuration
        """
        # Use proxy-based task for better success (recommended)
        task_type = "ReCaptchaV2EnterpriseTask" if (self.use_proxy and proxy) else "ReCaptchaV2EnterpriseTaskProxyLess"
        
        task = {
            "type": task_type,
            "websiteURL": url,
            "websiteKey": sitekey
        }
        
        # Add proxy if using proxy-based method
        if self.use_proxy and proxy:
            task["proxy"] = proxy
            logging.info(f"🔌 Using proxy: {proxy.split(':')[0]}:***")
        
        # Add enterprise payload with data-s if found
        if data_s:
            task["enterprisePayload"] = {"s": data_s}
            logging.info(f"📋 Including data-s: {data_s[:50]}...")
        else:
            logging.warning("⚠️  No data-s - this will likely cause rejection")
        
        payload = {
            "clientKey": self.api_key,
            "task": task
        }
        
        logging.info(f"🔄 Creating CapSolver task ({task_type})...")
        logging.debug(f"Task config: {json.dumps(task, indent=2)}")
        
        response = requests.post(f"{self.base_url}/createTask", json=payload)
        result = response.json()
        
        if result.get("errorId", 1) != 0:
            raise Exception(f"CapSolver error: {result.get('errorDescription', 'Unknown')}")
        
        task_id = result.get("taskId")
        if not task_id:
            raise Exception("No taskId received")
        
        logging.info(f"✓ Task created: {task_id}")
        
        # Poll for result
        for attempt in range(40):
            time.sleep(3)
            
            poll_response = requests.post(
                f"{self.base_url}/getTaskResult",
                json={"clientKey": self.api_key, "taskId": task_id}
            )
            poll_result = poll_response.json()
            
            status = poll_result.get("status")
            
            if status == "ready":
                solution = poll_result.get("solution", {})
                logging.info(f"✓ Solved in {(attempt + 1) * 3}s")
                return solution
            
            elif status == "failed" or poll_result.get("errorId", 0) != 0:
                error = poll_result.get("errorDescription", "Unknown error")
                raise Exception(f"Task failed: {error}")
            
            if attempt % 5 == 0:
                logging.info(f"⏳ Waiting... ({(attempt + 1) * 3}s)")
        
        raise Exception(f"Timeout after 120s")

class LavapopAutomation:
    def __init__(self):
        self.download_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(self.download_dir, exist_ok=True)
        
        # CapSolver configuration
        capsolver_key = os.getenv('CAPSOLVER_API_KEY')
        if not capsolver_key:
            raise Exception("CAPSOLVER_API_KEY not set")
        
        # Proxy configuration (optional but recommended)
        self.proxy = os.getenv('PROXY_STRING')  # Format: http:ip:port:user:pass
        self.use_proxy = bool(self.proxy)
        
        if self.use_proxy:
            logging.info(f"🔌 Proxy configured: {self.proxy.split(':')[0]}:***")
        else:
            logging.warning("⚠️  No proxy - using ProxyLess (lower success rate)")
        
        self.capsolver = CapSolverAPI(capsolver_key, use_proxy=self.use_proxy)
        
        # Credentials
        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')
        
        if not all([self.pos_url, self.username, self.password]):
            raise Exception("POS credentials not configured")
        
        # URLs
        self.sales_url = "https://lavpop.maxpan.com.br/system/sale"
        self.customer_url = "https://lavpop.maxpan.com.br/system/customer"
        
        # Google Drive
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        
        if not all([self.google_creds_json, self.sales_file_id, self.customer_file_id]):
            raise Exception("Google Drive not configured")
        
        self.driver = None
        
        logging.info("=" * 80)
        logging.info(f"Lavapop POS Automation v{VERSION}")
        logging.info(f"Advanced data-s extraction + {'Proxy mode' if self.use_proxy else 'ProxyLess mode'}")
        logging.info("=" * 80)
    
    def setup_driver(self):
        """Configure Chrome with anti-detection"""
        logging.info("🌐 Setting up Chrome with anti-detection...")
        
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--window-size=1920,1080')
        
        # Anti-detection critical settings
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)
        opts.add_argument('--disable-blink-features=AutomationControlled')
        
        # Modern User-Agent
        user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        opts.add_argument(f'user-agent={user_agent}')
        
        # Proxy configuration (IP consistency critical)
        if self.proxy:
            opts.add_argument(f'--proxy-server={self.proxy}')
        
        # Download settings
        opts.add_experimental_option("prefs", {
            "download.default_directory": self.download_dir,
            "download.prompt_for_download": False
        })
        
        driver = webdriver.Chrome(options=opts)
        
        # CDP commands for stealth
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                window.chrome = {runtime: {}};
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['pt-BR', 'pt', 'en-US']});
            '''
        })
        
        # Enable downloads in headless
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        driver.execute("send_command", {
            'cmd': 'Page.setDownloadBehavior',
            'params': {'behavior': 'allow', 'downloadPath': self.download_dir}
        })
        
        logging.info("✓ WebDriver ready with anti-detection")
        return driver
    
    def extract_data_s_advanced(self):
        """
        Advanced data-s extraction using multiple methods
        Now includes BFT (Block Frame Token) extraction
        """
        logging.info("🔍 Advanced data-s/bft extraction...")
        
        # Method 0: Extract BFT from reCAPTCHA bframe URL (CRITICAL)
        try:
            time.sleep(1)  # Wait for iframe to load
            iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha/api2/bframe" in src:
                    # Extract bft parameter
                    match = re.search(r'[\&?]bft=([^\&]+)', src)
                    if match:
                        bft = match.group(1)
                        logging.info(f"✓ Method 0 (BFT): {bft[:50]}...")
                        return bft
        except Exception as e:
            logging.debug(f"Method 0 (BFT) failed: {e}")
        
        # Method 1: JavaScript interception (inject before CAPTCHA loads)
        try:
            intercept_script = """
            window.__captured_data_s = null;
            
            // Hook into grecaptcha.enterprise.render
            (function() {
                var checkInterval = setInterval(function() {
                    if (window.grecaptcha && window.grecaptcha.enterprise) {
                        clearInterval(checkInterval);
                        
                        var originalRender = window.grecaptcha.enterprise.render;
                        window.grecaptcha.enterprise.render = function(container, parameters) {
                            console.log('CAPTCHA render intercepted', parameters);
                            if (parameters && parameters.s) {
                                window.__captured_data_s = parameters.s;
                                console.log('Captured data-s:', parameters.s.substring(0, 50));
                            }
                            return originalRender.call(this, container, parameters);
                        };
                    }
                }, 100);
                
                // Timeout after 10s
                setTimeout(function() { clearInterval(checkInterval); }, 10000);
            })();
            
            return window.__captured_data_s;
            """
            
            data_s = self.driver.execute_script(intercept_script)
            if data_s:
                logging.info(f"✓ Method 1 (JS intercept): {data_s[:50]}...")
                return data_s
        except Exception as e:
            logging.debug(f"Method 1 failed: {e}")
        
        # Wait for CAPTCHA to load
        time.sleep(2)
        
        # Method 2: DOM inspection
        try:
            elem = self.driver.find_element(By.CSS_SELECTOR, "[data-s]")
            data_s = elem.get_attribute("data-s")
            if data_s:
                logging.info(f"✓ Method 2 (DOM attr): {data_s[:50]}...")
                return data_s
        except:
            pass
        
        # Method 3: iframe src inspection
        try:
            iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src:
                    match = re.search(r'[\&?]s=([^\&]+)', src)
                    if match:
                        data_s = match.group(1)
                        logging.info(f"✓ Method 3 (iframe src): {data_s[:50]}...")
                        return data_s
        except:
            pass
        
        # Method 4: Search page source
        try:
            page_source = self.driver.page_source
            
            # Pattern 1: data-s="..."
            match = re.search(r'data-s=["\']([^"\']+)["\']', page_source)
            if match:
                data_s = match.group(1)
                logging.info(f"✓ Method 4a (HTML attr): {data_s[:50]}...")
                return data_s
            
            # Pattern 2: "s":"..."
            match = re.search(r'"s"\s*:\s*"([^"]+)"', page_source)
            if match:
                data_s = match.group(1)
                logging.info(f"✓ Method 4b (JSON): {data_s[:50]}...")
                return data_s
        except:
            pass
        
        # Method 5: Check window variables
        try:
            data_s = self.driver.execute_script("""
                if (window.__captured_data_s) return window.__captured_data_s;
                
                // Check for reCAPTCHA config object
                if (window.___grecaptcha_cfg) {
                    var clients = window.___grecaptcha_cfg.clients;
                    for (var clientId in clients) {
                        var client = clients[clientId];
                        for (var key in client) {
                            if (client[key] && client[key].s) {
                                return client[key].s;
                            }
                        }
                    }
                }
                return null;
            """)
            
            if data_s:
                logging.info(f"✓ Method 5 (window vars): {data_s[:50]}...")
                return data_s
        except:
            pass
        
        logging.warning("⚠️  data-s NOT FOUND after 5 methods")
        logging.info("💡 Suggestion: Use CapSolver Browser Extension to capture parameters")
        return None
    
    def login(self):
        """Login with advanced CAPTCHA solving"""
        logging.info("🔐 Starting login...")
        
        self.driver.get(self.pos_url)
        logging.info(f"📄 Loaded: {self.pos_url}")
        
        # Wait for form
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="email"]'))
        )
        
        # Human-like delay
        time.sleep(random.uniform(1.5, 3.0))
        
        self.driver.save_screenshot("01_login_page.png")
        logging.info("📸 Screenshot: 01_login_page.png")
        
        # Enter credentials with human timing
        email_field = self.driver.find_element(By.CSS_SELECTOR, 'input[name="email"]')
        password_field = self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        
        email_field.clear()
        for char in self.username:
            email_field.send_keys(char)
            time.sleep(random.uniform(0.08, 0.15))
        
        time.sleep(random.uniform(0.5, 1.0))
        
        password_field.clear()
        for char in self.password:
            password_field.send_keys(char)
            time.sleep(random.uniform(0.08, 0.15))
        
        logging.info("✓ Credentials entered")
        
        # Wait for reCAPTCHA
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'iframe[src*="recaptcha"]'))
        )
        logging.info("✓ reCAPTCHA detected")
        
        # Extract sitekey
        sitekey = None
        for iframe in self.driver.find_elements(By.TAG_NAME, "iframe"):
            src = iframe.get_attribute("src") or ""
            if "recaptcha" in src and "k=" in src:
                sitekey = src.split("k=")[1].split("&")[0]
                break
        
        if not sitekey:
            self.driver.save_screenshot("02_no_sitekey.png")
            raise Exception("Could not extract sitekey")
        
        logging.info(f"✓ Sitekey: {sitekey}")
        
        # Extract data-s (CRITICAL)
        data_s = self.extract_data_s_advanced()
        
        self.driver.save_screenshot("02_before_solve.png")
        
        # Solve with CapSolver
        logging.info("🤖 Solving with CapSolver...")
        solution = self.capsolver.solve_recaptcha_v2_enterprise(
            sitekey=sitekey,
            url=self.driver.current_url,
            data_s=data_s,
            proxy=self.proxy
        )
        
        token = solution.get("gRecaptchaResponse")
        if not token:
            raise Exception("No token in solution")
        
        logging.info(f"✓ Token: {token[:50]}...")
        
        # Inject token + cookies immediately
        inject_script = f'''
            var token = "{token}";
            var textarea = document.getElementById("g-recaptcha-response");
            if (textarea) {{
                textarea.value = token;
                textarea.innerHTML = token;
                textarea.style.display = "block";
            }}
            
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var clients = ___grecaptcha_cfg.clients;
                for (var clientId in clients) {{
                    var client = clients[clientId];
                    for (var key in client) {{
                        var obj = client[key];
                        if (obj && typeof obj.callback === 'function') {{
                            obj.callback(token);
                        }}
                    }}
                }}
            }}
        '''
        
        # Add cookies if present
        if solution.get("recaptcha-ca-e"):
            inject_script += f'document.cookie = "recaptcha-ca-e={solution["recaptcha-ca-e"]}; path=/";'
        if solution.get("recaptcha-ca-t"):
            inject_script += f'document.cookie = "recaptcha-ca-t={solution["recaptcha-ca-t"]}; path=/";'
        
        self.driver.execute_script(inject_script)
        logging.info("✓ Token injected")
        
        # Small human delay
        time.sleep(random.uniform(0.8, 1.5))
        
        self.driver.save_screenshot("03_after_injection.png")
        
        # Submit immediately (tokens expire fast)
        submit_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]")
        submit_button.click()
        logging.info("✓ Submitted")
        
        time.sleep(5)
        
        self.driver.save_screenshot("04_after_submit.png")
        
        # Check result
        current_url = self.driver.current_url
        body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        
        logging.info(f"Current URL: {current_url}")
        
        if "preencha o captcha" in body_text or "captcha" in body_text:
            logging.error(f"❌ Token rejected")
            logging.error(f"Page excerpt: {body_text[:500]}")
            raise Exception("Token rejected by server")
        
        if 'system' not in current_url:
            logging.error(f"❌ No redirect. URL: {current_url}")
            raise Exception("Login failed: no redirect")
        
        logging.info("✅ LOGIN SUCCESSFUL!")
        return True
    
    def export_sales(self):
        logging.info("💰 Exporting sales...")
        self.driver.get(self.sales_url)
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Ontem')]").click()
        time.sleep(2)
        
        opts = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
        if len(opts) > 1:
            opts[1].click()
            time.sleep(1)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Aplicar')]").click()
        time.sleep(2)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Buscar')]").click()
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        filepath = self.wait_for_download()
        logging.info(f"✓ Downloaded: {os.path.basename(filepath)}")
        
        self.upload_to_drive(filepath, self.sales_file_id, "sales")
        return filepath
    
    def export_customers(self):
        logging.info("👥 Exporting customers...")
        self.driver.get(self.customer_url)
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        filepath = self.wait_for_download()
        logging.info(f"✓ Downloaded: {os.path.basename(filepath)}")
        
        self.upload_to_drive(filepath, self.customer_file_id, "customers")
        return filepath
    
    def wait_for_download(self, timeout=60):
        logging.info("⏳ Waiting for download...")
        
        initial = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start = time.time()
        
        while time.time() - start < timeout:
            current = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            for f in current - initial:
                if not f.endswith(('.crdownload', '.tmp', '.part')) and os.path.getsize(f) > 0:
                    time.sleep(1)
                    return f
            time.sleep(1)
        
        raise Exception(f"Download timeout after {timeout}s")
    
    def upload_to_drive(self, filepath, file_id, file_type):
        logging.info(f"☁️  Uploading to Drive...")
        
        creds = Credentials.from_authorized_user_info(json.loads(self.google_creds_json))
        service = build('drive', 'v3', credentials=creds)
        
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        filename = f"{file_type}_{yesterday}.csv"
        
        media = MediaFileUpload(filepath, mimetype='text/csv')
        service.files().update(
            fileId=file_id,
            body={'name': filename},
            media_body=media
        ).execute()
        
        logging.info(f"✓ Uploaded: {filename}")
    
    def run(self):
        try:
            self.driver = self.setup_driver()
            
            self.login()
            
            self.export_sales()
            self.export_customers()
            
            logging.info("=" * 80)
            logging.info("✅ AUTOMATION COMPLETED")
            logging.info("=" * 80)
            
            return True
            
        except Exception as e:
            logging.error("=" * 80)
            logging.error(f"❌ FAILED: {str(e)}")
            logging.error("=" * 80)
            logging.exception("Traceback:")
            
            if self.driver:
                try:
                    self.driver.save_screenshot("99_error.png")
                    logging.info("📸 Error screenshot: 99_error.png")
                except:
                    pass
            
            return False
            
        finally:
            if self.driver:
                self.driver.quit()
                logging.info("🔒 Browser closed")

def main():
    automation = LavapopAutomation()
    success = automation.run()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
