"""
Lavapop POS Automation v2.6
- CapSolver integration for Enterprise reCAPTCHA
- Enhanced debugging and logging
- Automated daily export of sales and customer data
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
import json, time, os, logging, glob, re
from datetime import datetime, timedelta

VERSION = "2.6"

# Configure detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pos_automation.log'),
        logging.StreamHandler()
    ]
)

class CapSolverAPI:
    """CapSolver API wrapper for Enterprise reCAPTCHA solving"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.capsolver.com"
    
    def solve_recaptcha_v2_enterprise(self, sitekey, url, data_s=None):
        """
        Solve reCAPTCHA v2 Enterprise
        
        Args:
            sitekey: The reCAPTCHA site key
            url: The page URL
            data_s: Optional enterprise payload 's' parameter (critical if present)
        
        Returns:
            dict: Solution containing gRecaptchaResponse and optional cookies
        """
        # Build task payload
        task = {
            "type": "ReCaptchaV2EnterpriseTaskProxyLess",
            "websiteURL": url,
            "websiteKey": sitekey
        }
        
        # Add enterprise payload if data-s exists
        if data_s:
            task["enterprisePayload"] = {"s": data_s}
            logging.info(f"📋 Including enterprisePayload with s={data_s[:50]}...")
        else:
            logging.warning("⚠️  No data-s parameter found - this may cause token rejection")
        
        payload = {
            "clientKey": self.api_key,
            "task": task
        }
        
        logging.info("🔄 Creating CapSolver task...")
        logging.debug(f"Task payload: {json.dumps(task, indent=2)}")
        
        # Create task
        response = requests.post(f"{self.base_url}/createTask", json=payload)
        result = response.json()
        
        logging.debug(f"Create task response: {json.dumps(result, indent=2)}")
        
        if result.get("errorId", 1) != 0:
            raise Exception(f"CapSolver createTask error: {result.get('errorDescription', 'Unknown error')}")
        
        task_id = result.get("taskId")
        if not task_id:
            raise Exception("No taskId received from CapSolver")
        
        logging.info(f"✓ Task created: {task_id}")
        
        # Poll for result (max 2 minutes)
        max_attempts = 40
        for attempt in range(max_attempts):
            time.sleep(3)
            
            poll_payload = {
                "clientKey": self.api_key,
                "taskId": task_id
            }
            
            response = requests.post(f"{self.base_url}/getTaskResult", json=poll_payload)
            result = response.json()
            
            status = result.get("status")
            
            if status == "ready":
                solution = result.get("solution", {})
                logging.info(f"✓ Solution received after {(attempt + 1) * 3}s")
                logging.debug(f"Solution keys: {solution.keys()}")
                return solution
            
            elif status == "failed" or result.get("errorId", 0) != 0:
                error_desc = result.get("errorDescription", "Unknown error")
                raise Exception(f"CapSolver task failed: {error_desc}")
            
            # Log progress every 15 seconds
            if attempt % 5 == 0:
                logging.info(f"⏳ Waiting for solution... ({(attempt + 1) * 3}s elapsed)")
        
        raise Exception(f"CapSolver timeout after {max_attempts * 3}s")

class LavapopAutomation:
    def __init__(self):
        # Setup directories
        self.download_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(self.download_dir, exist_ok=True)
        
        # Initialize CapSolver
        capsolver_key = os.getenv('CAPSOLVER_API_KEY')
        if not capsolver_key:
            raise Exception("CAPSOLVER_API_KEY environment variable not set")
        self.capsolver = CapSolverAPI(capsolver_key)
        
        # POS credentials
        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')
        
        if not all([self.pos_url, self.username, self.password]):
            raise Exception("POS credentials not properly configured")
        
        # URLs
        self.sales_url = "https://lavpop.maxpan.com.br/system/sale"
        self.customer_url = "https://lavpop.maxpan.com.br/system/customer"
        
        # Google Drive config
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        
        if not all([self.google_creds_json, self.sales_file_id, self.customer_file_id]):
            raise Exception("Google Drive credentials not properly configured")
        
        self.driver = None
        
        logging.info("=" * 80)
        logging.info(f"Lavapop POS Automation v{VERSION}")
        logging.info("CapSolver Enterprise reCAPTCHA Integration")
        logging.info("=" * 80)
        
    def setup_driver(self):
        """Configure Chrome WebDriver with optimal settings"""
        logging.info("🌐 Setting up Chrome WebDriver...")
        
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--disable-blink-features=AutomationControlled')
        opts.add_argument('--window-size=1920,1080')
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)
        
        # Download preferences
        opts.add_experimental_option("prefs", {
            "download.default_directory": self.download_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        })
        
        driver = webdriver.Chrome(options=opts)
        
        # Enable downloads in headless mode
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        driver.execute("send_command", {
            'cmd': 'Page.setDownloadBehavior',
            'params': {'behavior': 'allow', 'downloadPath': self.download_dir}
        })
        
        logging.info("✓ WebDriver ready")
        return driver
    
    def extract_data_s_parameter(self):
        """
        Extract the Enterprise reCAPTCHA 's' parameter (data-s)
        This is CRITICAL for Enterprise reCAPTCHA validation
        """
        logging.info("🔍 Searching for data-s parameter...")
        
        # Method 1: Check iframe src attributes
        try:
            iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src:
                    logging.debug(f"Checking iframe: {src[:100]}...")
                    
                    # Look for s= parameter in URL
                    match = re.search(r'[?&]s=([^&]+)', src)
                    if match:
                        data_s = match.group(1)
                        logging.info(f"✓ Found data-s in iframe: {data_s[:50]}...")
                        return data_s
        except Exception as e:
            logging.warning(f"Method 1 failed: {e}")
        
        # Method 2: Check data attributes on page elements
        try:
            data_s = self.driver.execute_script("""
                var elements = document.querySelectorAll('[data-s]');
                for (var i = 0; i < elements.length; i++) {
                    var val = elements[i].getAttribute('data-s');
                    if (val) return val;
                }
                
                var recaptcha = document.querySelector('.g-recaptcha');
                if (recaptcha) return recaptcha.getAttribute('data-s');
                
                return null;
            """)
            
            if data_s:
                logging.info(f"✓ Found data-s in DOM: {data_s[:50]}...")
                return data_s
        except Exception as e:
            logging.warning(f"Method 2 failed: {e}")
        
        # Method 3: Search page source
        try:
            page_source = self.driver.page_source
            
            # Pattern 1: data-s="value"
            match = re.search(r'data-s=["\']([^"\']+)["\']', page_source)
            if match:
                data_s = match.group(1)
                logging.info(f"✓ Found data-s in source: {data_s[:50]}...")
                return data_s
            
            # Pattern 2: "s":"value" in JSON
            match = re.search(r'"s"\s*:\s*"([^"]+)"', page_source)
            if match:
                data_s = match.group(1)
                logging.info(f"✓ Found 's' in JSON: {data_s[:50]}...")
                return data_s
        except Exception as e:
            logging.warning(f"Method 3 failed: {e}")
        
        logging.warning("⚠️  Could not extract data-s parameter")
        return None
    
    def login(self):
        """Login to POS system with CapSolver Enterprise reCAPTCHA solving"""
        logging.info("🔐 Starting login process...")
        
        # Navigate to login page
        self.driver.get(self.pos_url)
        logging.info(f"📄 Loaded: {self.pos_url}")
        
        # Wait for form to load
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="email"]'))
        )
        time.sleep(2)
        
        # Take screenshot of login page
        self.driver.save_screenshot("01_login_page.png")
        logging.info("📸 Screenshot: 01_login_page.png")
        
        # Enter credentials
        email_field = self.driver.find_element(By.CSS_SELECTOR, 'input[name="email"]')
        password_field = self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        
        email_field.clear()
        email_field.send_keys(self.username)
        password_field.clear()
        password_field.send_keys(self.password)
        
        logging.info("✓ Credentials entered")
        time.sleep(1)
        
        # Wait for reCAPTCHA to load
        WebDriverWait(self.driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'iframe[src*="recaptcha"]'))
        )
        logging.info("✓ reCAPTCHA iframe detected")
        
        # Extract sitekey
        sitekey = None
        for iframe in self.driver.find_elements(By.TAG_NAME, "iframe"):
            src = iframe.get_attribute("src") or ""
            if "recaptcha" in src and "k=" in src:
                sitekey = src.split("k=")[1].split("&")[0]
                break
        
        if not sitekey:
            self.driver.save_screenshot("02_no_sitekey.png")
            raise Exception("Could not extract reCAPTCHA sitekey")
        
        logging.info(f"✓ Sitekey: {sitekey}")
        
        # Extract data-s parameter (critical for Enterprise)
        data_s = self.extract_data_s_parameter()
        
        # Take screenshot before solving
        self.driver.save_screenshot("02_before_solve.png")
        logging.info("📸 Screenshot: 02_before_solve.png")
        
        # Solve with CapSolver
        logging.info("🤖 Solving reCAPTCHA with CapSolver...")
        solution = self.capsolver.solve_recaptcha_v2_enterprise(
            sitekey=sitekey,
            url=self.driver.current_url,
            data_s=data_s
        )
        
        token = solution.get("gRecaptchaResponse")
        if not token:
            raise Exception("No gRecaptchaResponse in solution")
        
        logging.info(f"✓ Token received: {token[:50]}...")
        
        # Inject token and optional cookies
        inject_script = f'''
            var token = "{token}";
            
            // Set token in hidden textarea
            var textarea = document.getElementById("g-recaptcha-response");
            if (textarea) {{
                textarea.value = token;
                textarea.innerHTML = token;
                textarea.style.display = "block";
                console.log("Token injected into textarea");
            }}
            
            // Trigger reCAPTCHA callback
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var clients = ___grecaptcha_cfg.clients;
                for (var clientId in clients) {{
                    var client = clients[clientId];
                    for (var key in client) {{
                        var obj = client[key];
                        if (obj && typeof obj.callback === 'function') {{
                            console.log("Triggering callback for client:", clientId);
                            obj.callback(token);
                        }}
                    }}
                }}
            }}
        '''
        
        # Add optional cookies if present
        if solution.get("recaptcha-ca-e"):
            inject_script += f'''
            document.cookie = "recaptcha-ca-e={solution['recaptcha-ca-e']}; path=/";
            console.log("Set recaptcha-ca-e cookie");
            '''
        
        if solution.get("recaptcha-ca-t"):
            inject_script += f'''
            document.cookie = "recaptcha-ca-t={solution['recaptcha-ca-t']}; path=/";
            console.log("Set recaptcha-ca-t cookie");
            '''
        
        self.driver.execute_script(inject_script)
        logging.info("✓ Token and cookies injected")
        
        time.sleep(2)
        
        # Take screenshot after injection
        self.driver.save_screenshot("03_after_injection.png")
        logging.info("📸 Screenshot: 03_after_injection.png")
        
        # Submit form
        submit_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]")
        submit_button.click()
        logging.info("✓ Form submitted")
        
        time.sleep(5)
        
        # Take screenshot after submit
        self.driver.save_screenshot("04_after_submit.png")
        logging.info("📸 Screenshot: 04_after_submit.png")
        
        # Check result
        current_url = self.driver.current_url
        body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        
        logging.info(f"Current URL: {current_url}")
        
        # Check for error messages
        error_phrases = ["preencha o captcha", "captcha", "erro", "error"]
        found_errors = [phrase for phrase in error_phrases if phrase in body_text]
        
        if found_errors:
            logging.error(f"❌ Error detected: {found_errors}")
            logging.error(f"Page excerpt: {body_text[:500]}")
            raise Exception(f"Login failed: {', '.join(found_errors)}")
        
        # Check for successful redirect
        if 'system' not in current_url:
            logging.error(f"❌ Not redirected to system. URL: {current_url}")
            raise Exception("Login failed: No redirect to system")
        
        logging.info("✅ LOGIN SUCCESSFUL!")
        logging.info(f"Authenticated URL: {current_url}")
        
        return True
    
    def export_sales(self):
        """Export sales report from POS"""
        logging.info("💰 Exporting sales data...")
        
        self.driver.get(self.sales_url)
        time.sleep(4)
        
        # Select "Yesterday" date range
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Ontem')]").click()
        time.sleep(2)
        
        # Confirm if multiple options
        yesterday_options = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
        if len(yesterday_options) > 1:
            yesterday_options[1].click()
            time.sleep(1)
        
        # Apply filter
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Aplicar')]").click()
        time.sleep(2)
        
        # Search
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Buscar')]").click()
        time.sleep(4)
        
        # Export
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        filepath = self.wait_for_download()
        logging.info(f"✓ Downloaded: {os.path.basename(filepath)}")
        
        self.upload_to_drive(filepath, self.sales_file_id, "sales")
        
        return filepath
    
    def export_customers(self):
        """Export customer list from POS"""
        logging.info("👥 Exporting customer data...")
        
        self.driver.get(self.customer_url)
        time.sleep(4)
        
        # Export
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        filepath = self.wait_for_download()
        logging.info(f"✓ Downloaded: {os.path.basename(filepath)}")
        
        self.upload_to_drive(filepath, self.customer_file_id, "customers")
        
        return filepath
    
    def wait_for_download(self, timeout=60):
        """Wait for CSV download to complete"""
        logging.info("⏳ Waiting for download...")
        
        initial_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            current_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new_files = current_files - initial_files
            
            for filepath in new_files:
                # Skip temporary files
                if filepath.endswith(('.crdownload', '.tmp', '.part')):
                    continue
                
                # Check if file has content
                if os.path.getsize(filepath) > 0:
                    time.sleep(1)  # Ensure write is complete
                    return filepath
            
            time.sleep(1)
        
        raise Exception(f"Download timeout after {timeout}s")
    
    def upload_to_drive(self, filepath, file_id, file_type):
        """Upload file to Google Drive"""
        logging.info(f"☁️  Uploading {file_type} to Google Drive...")
        
        creds = Credentials.from_authorized_user_info(
            json.loads(self.google_creds_json)
        )
        service = build('drive', 'v3', credentials=creds)
        
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        filename = f"{file_type}_{yesterday}.csv"
        
        media = MediaFileUpload(filepath, mimetype='text/csv')
        
        service.files().update(
            fileId=file_id,
            body={'name': filename},
            media_body=media
        ).execute()
        
        logging.info(f"✓ Uploaded to Drive: {filename}")
    
    def run(self):
        """Main execution flow"""
        try:
            # Setup
            self.driver = self.setup_driver()
            
            # Login
            self.login()
            
            # Export data
            self.export_sales()
            self.export_customers()
            
            logging.info("=" * 80)
            logging.info("✅ AUTOMATION COMPLETED SUCCESSFULLY")
            logging.info("=" * 80)
            
            return True
            
        except Exception as e:
            logging.error("=" * 80)
            logging.error(f"❌ AUTOMATION FAILED: {str(e)}")
            logging.error("=" * 80)
            logging.exception("Full traceback:")
            
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
