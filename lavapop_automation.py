"""
Lavapop POS Automation - v1.9
Following 2Captcha documented approach exactly
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from twocaptcha import TwoCaptcha
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import json, time, os, logging, glob
from datetime import datetime, timedelta

VERSION = "1.9"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('pos_automation.log'), logging.StreamHandler()]
)

class LavapopAutomation:
    def __init__(self):
        self.download_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(self.download_dir, exist_ok=True)
        
        self.solver = TwoCaptcha(os.getenv('CAPTCHA_API_KEY'))
        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')
        
        self.sales_url = "https://lavpop.maxpan.com.br/system/sale"
        self.customer_url = "https://lavpop.maxpan.com.br/system/customer"
        
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        self.driver = None
        
        logging.info("="*70)
        logging.info(f"LAVAPOP v{VERSION} - 2Captcha documented method")
        logging.info("="*70)
        
    def setup_driver(self):
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--window-size=1920,1080')
        
        prefs = {"download.default_directory": self.download_dir, "download.prompt_for_download": False}
        opts.add_experimental_option("prefs", prefs)
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        driver = webdriver.Chrome(options=opts)
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        driver.execute("send_command", {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}})
        
        return driver
    
    def login(self):
        logging.info("Login process...")
        
        self.driver.get(self.pos_url)
        time.sleep(3)
        self.driver.save_screenshot("01_page.png")
        
        # Fill credentials
        self.driver.find_element(By.CSS_SELECTOR, 'input[name="email"]').send_keys(self.username)
        self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys(self.password)
        
        logging.info("✓ Credentials filled")
        self.driver.save_screenshot("02_creds.png")
        
        # Get sitekey from div (2Captcha documented way)
        sitekey = self.driver.execute_script('''
            var div = document.querySelector('.g-recaptcha');
            return div ? div.getAttribute('data-sitekey') : null;
        ''')
        
        if not sitekey:
            # Fallback to iframe
            for iframe in self.driver.find_elements(By.TAG_NAME, "iframe"):
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src and "k=" in src:
                    sitekey = src.split("k=")[1].split("&")[0]
                    break
        
        logging.info(f"Sitekey: {sitekey}")
        logging.info("Solving with 2Captcha...")
        
        # Solve
        result = self.solver.recaptcha(sitekey=sitekey, url=self.driver.current_url)
        token = result['code']
        logging.info(f"✓ Token: {token[:40]}...")
        
        # 2CAPTCHA DOCUMENTED METHOD: Set textarea then trigger callback
        inject_result = self.driver.execute_script(f'''
            var token = "{token}";
            
            // Step 1: Find and set textarea (documented method)
            var textarea = document.getElementById("g-recaptcha-response");
            if (!textarea) return "no_textarea";
            
            textarea.innerHTML = token;
            textarea.value = token;
            textarea.style.display = "block";  // Make visible for debugging
            
            // Step 2: Trigger callback via ___grecaptcha_cfg (proven working)
            var callbackExecuted = false;
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var clients = ___grecaptcha_cfg.clients;
                for (var client in clients) {{
                    for (var widget in clients[client]) {{
                        var widgetObj = clients[client][widget];
                        if (widgetObj && widgetObj.callback) {{
                            widgetObj.callback(token);
                            callbackExecuted = true;
                        }}
                    }}
                }}
            }}
            
            // Step 3: Mark reCAPTCHA as complete in internal state
            if (typeof grecaptcha !== 'undefined') {{
                // Override getResponse to return our token
                var originalGetResponse = grecaptcha.getResponse;
                grecaptcha.getResponse = function() {{ return token; }};
            }}
            
            // Step 4: Find the g-recaptcha div and mark it as complete
            var recaptchaDiv = document.querySelector('.g-recaptcha');
            if (recaptchaDiv) {{
                recaptchaDiv.setAttribute('data-response', token);
            }}
            
            return callbackExecuted ? "success_with_callback" : "success_no_callback";
        ''')
        
        logging.info(f"✓ Injection: {inject_result}")
        
        # Wait for any async processing
        time.sleep(3)
        
        # Verify textarea has value
        has_value = self.driver.execute_script('''
            var textarea = document.getElementById("g-recaptcha-response");
            return textarea && textarea.value.length > 0;
        ''')
        
        logging.info(f"Textarea has token: {has_value}")
        self.driver.save_screenshot("03_ready.png")
        
        # Submit form
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]").click()
        logging.info("✓ Submitted")
        
        time.sleep(5)
        self.driver.save_screenshot("04_after.png")
        
        # Check for error
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        if "preencha o captcha" in body:
            logging.error("✗ Form validation rejected our token")
            logging.error("Possible causes:")
            logging.error("  1. Form validates token server-side with Google")
            logging.error("  2. Browser fingerprint mismatch")
            logging.error("  3. This site has additional anti-bot protection")
            raise Exception("CAPTCHA validation failed")
        
        if 'system' in self.driver.current_url:
            logging.info(f"✓ Login success: {self.driver.current_url}")
            return True
        else:
            raise Exception(f"URL didn't change: {self.driver.current_url}")
    
    def export_sales(self):
        logging.info("="*70)
        logging.info("Sales export...")
        
        self.driver.get(self.sales_url)
        time.sleep(4)
        self.driver.save_screenshot("05_sales.png")
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Ontem')]").click()
        time.sleep(2)
        
        options = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
        if len(options) > 1:
            options[1].click()
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Aplicar')]").click()
        time.sleep(2)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Buscar')]").click()
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        file = self.wait_download()
        logging.info(f"✓ {os.path.basename(file)}")
        
        self.upload_drive(file, self.sales_file_id, "sales")
        return file
    
    def export_customers(self):
        logging.info("="*70)
        logging.info("Customer export...")
        
        self.driver.get(self.customer_url)
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        file = self.wait_download()
        logging.info(f"✓ {os.path.basename(file)}")
        
        self.upload_drive(file, self.customer_file_id, "customers")
        return file
    
    def wait_download(self, timeout=30):
        initial = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start = time.time()
        
        while time.time() - start < timeout:
            current = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new = current - initial
            
            for f in new:
                if not f.endswith(('.crdownload', '.tmp')) and os.path.getsize(f) > 0:
                    time.sleep(1)
                    return f
            time.sleep(1)
        
        raise Exception("Download timeout")
    
    def upload_drive(self, file_path, file_id, file_type):
        creds = Credentials.from_authorized_user_info(json.loads(self.google_creds_json))
        service = build('drive', 'v3', credentials=creds)
        
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        filename = f"{file_type}_{yesterday}.csv"
        
        media = MediaFileUpload(file_path, mimetype='text/csv')
        service.files().update(fileId=file_id, body={'name': filename}, media_body=media).execute()
        logging.info(f"✓ Uploaded: {filename}")
    
    def run(self):
        try:
            self.driver = self.setup_driver()
            
            self.login()
            self.export_sales()
            self.export_customers()
            
            logging.info("="*70)
            logging.info("✓ SUCCESS")
            logging.info("="*70)
            return True
            
        except Exception as e:
            logging.error(f"✗ FAILED: {e}", exc_info=True)
            self.driver.save_screenshot("error.png")
            return False
        finally:
            if self.driver:
                self.driver.quit()

def main():
    exit(0 if LavapopAutomation().run() else 1)

if __name__ == "__main__":
    main()
