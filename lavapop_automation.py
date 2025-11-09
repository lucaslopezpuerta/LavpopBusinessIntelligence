"""
Lavapop POS Automation - v1.3
Fix: CAPTCHA callback execution - checkbox must show as checked before submit
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from twocaptcha import TwoCaptcha
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import json, time, os, logging, glob
from datetime import datetime, timedelta

VERSION = "1.3"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('pos_automation.log'), logging.StreamHandler()]
)

class LavapopAutomation:
    def __init__(self):
        self.download_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(self.download_dir, exist_ok=True)
        
        self.captcha_api_key = os.getenv('CAPTCHA_API_KEY')
        self.solver = TwoCaptcha(self.captcha_api_key)
        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')
        
        self.base_url = self.pos_url.split('/login')[0] if '/login' in self.pos_url else self.pos_url.rsplit('/', 1)[0]
        self.sales_url = f"{self.base_url}/system/sale"
        self.customer_url = f"{self.base_url}/system/customer"
        
        logging.info(f"Version: {VERSION}")
        
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        self.driver = None
        
    def setup_driver(self):
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        prefs = {
            "download.default_directory": self.download_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": False
        }
        chrome_options.add_experimental_option("prefs", prefs)
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}}
        driver.execute("send_command", params)
        
        return driver
    
    def solve_recaptcha_v2(self, driver):
        logging.info("🔍 Solving reCAPTCHA...")
        time.sleep(2)
        
        # Find site key
        site_key = None
        for iframe in driver.find_elements(By.TAG_NAME, "iframe"):
            src = iframe.get_attribute("src") or ""
            if "recaptcha" in src and "k=" in src:
                site_key = src.split("k=")[1].split("&")[0]
                break
        
        if not site_key:
            try:
                site_key = driver.find_element(By.CLASS_NAME, "g-recaptcha").get_attribute("data-sitekey")
            except:
                pass
        
        if not site_key:
            raise Exception("reCAPTCHA not found")
        
        logging.info(f"✅ Sitekey: {site_key}")
        
        # Solve
        result = self.solver.recaptcha(sitekey=site_key, url=driver.current_url)
        token = result['code']
        logging.info(f"✅ Token: {token[:40]}...")
        
        # INJECT AND TRIGGER
        success = driver.execute_script(f'''
            var token = "{token}";
            
            // Set textarea
            var textarea = document.getElementById("g-recaptcha-response");
            textarea.innerHTML = token;
            textarea.value = token;
            
            // Find ALL possible callbacks
            var callbacks = [];
            var recaptchaDiv = document.querySelector('.g-recaptcha');
            if (recaptchaDiv) {{
                var cb = recaptchaDiv.getAttribute('data-callback');
                if (cb) callbacks.push(cb);
            }}
            
            // Try executing callbacks
            for (var name of callbacks) {{
                if (typeof window[name] === 'function') {{
                    window[name](token);
                    return 'executed:' + name;
                }}
            }}
            
            // Try common names
            var common = ['onSuccess', 'submitForm', 'captchaSuccess'];
            for (var name of common) {{
                if (typeof window[name] === 'function') {{
                    window[name](token);
                    return 'executed:' + name;
                }}
            }}
            
            // Just submit form directly
            var form = document.querySelector('form');
            if (form) {{
                var event = new Event('submit', {{bubbles: true, cancelable: true}});
                form.dispatchEvent(event);
                return 'form_submitted';
            }}
            
            return 'token_set';
        ''')
        
        logging.info(f"📝 Result: {success}")
        time.sleep(5)  # Longer wait
        
        return True
    
    def login(self, driver):
        try:
            logging.info(f"🌐 Opening: {self.pos_url}")
            driver.get(self.pos_url)
            time.sleep(3)
            
            driver.save_screenshot("01_login_page.png")
            
            # Fill fields
            selectors_email = [(By.NAME, "email"), (By.ID, "email"), (By.CSS_SELECTOR, "input[type='email']")]
            selectors_pass = [(By.NAME, "password"), (By.CSS_SELECTOR, "input[type='password']")]
            
            email_field = None
            for sel_type, sel_val in selectors_email:
                try:
                    email_field = WebDriverWait(driver, 2).until(EC.presence_of_element_located((sel_type, sel_val)))
                    break
                except:
                    continue
            
            pass_field = None
            for sel_type, sel_val in selectors_pass:
                try:
                    pass_field = driver.find_element(sel_type, sel_val)
                    break
                except:
                    continue
            
            if not email_field or not pass_field:
                raise Exception("Login fields not found")
            
            email_field.clear()
            email_field.send_keys(self.username)
            pass_field.clear()
            pass_field.send_keys(self.password)
            
            driver.save_screenshot("02_credentials_filled.png")
            
            # Solve CAPTCHA
            self.solve_recaptcha_v2(driver)
            
            driver.save_screenshot("03_captcha_solved.png")
            
            # If form didn't auto-submit, click button
            logging.info("🔘 Checking if button click needed...")
            time.sleep(2)
            
            # Check if still on login page
            if 'login' in driver.current_url.lower() or driver.find_elements(By.CSS_SELECTOR, "input[type='password']"):
                logging.info("Still on login page, clicking submit...")
                
                # Find button
                button = None
                for selector in ["button[type='submit']", "//button[contains(text(), 'Entrar')]"]:
                    try:
                        if selector.startswith("//"):
                            buttons = driver.find_elements(By.XPATH, selector)
                        else:
                            buttons = driver.find_elements(By.CSS_SELECTOR, selector)
                        for btn in buttons:
                            if btn.is_displayed():
                                button = btn
                                break
                        if button:
                            break
                    except:
                        continue
                
                if button:
                    try:
                        button.click()
                    except:
                        driver.execute_script("arguments[0].click();", button)
                    logging.info("✅ Button clicked")
                else:
                    logging.warning("Button not found, form may have auto-submitted")
                
                driver.save_screenshot("04_button_clicked.png")
            else:
                logging.info("✅ Form auto-submitted!")
            
            # Wait for redirect
            logging.info("⏳ Waiting for redirect...")
            try:
                WebDriverWait(driver, 45).until(
                    lambda d: '/system' in d.current_url or 'dashboard' in d.current_url.lower()
                )
                logging.info(f"✅ Redirected: {driver.current_url}")
            except TimeoutException:
                logging.warning("Timeout, checking login status...")
            
            time.sleep(3)
            driver.save_screenshot("05_after_login.png")
            
            # Verify
            if '/system' not in driver.current_url:
                body = driver.find_element(By.TAG_NAME, "body").text.lower()
                if 'venda' not in body and 'cliente' not in body:
                    raise Exception("Login failed - not on dashboard")
            
            logging.info("✅ Login successful!")
            return True
            
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot("error_login.png")
            raise
    
    def navigate_to_page(self, driver, url, sidebar_text):
        try:
            driver.get(url)
            time.sleep(3)
            return True
        except:
            return False
    
    def find_and_click(self, driver, text):
        try:
            elems = driver.find_elements(By.XPATH, f"//*[contains(text(), '{text}')]")
            for elem in elems:
                if elem.is_displayed() and elem.is_enabled():
                    elem.click()
                    return True
            return False
        except:
            return False
    
    def export_sales(self, driver):
        if not self.navigate_to_page(driver, self.sales_url, "Venda"):
            raise Exception("Navigate failed")
        driver.save_screenshot("10_sales.png")
        
        if self.find_and_click(driver, "Ontem"):
            time.sleep(2)
            btns = driver.find_elements(By.XPATH, "//*[text()='Ontem']")
            if len(btns) > 1:
                try:
                    btns[1].click()
                except:
                    pass
            self.find_and_click(driver, "Aplicar")
            time.sleep(2)
        
        self.find_and_click(driver, "Buscar")
        time.sleep(4)
        
        if not self.find_and_click(driver, "Exportar"):
            raise Exception("Export button not found")
        
        file = self.wait_for_download()
        if file:
            logging.info(f"✅ Sales: {os.path.basename(file)}")
            return file
        raise Exception("Download timeout")
    
    def export_customers(self, driver):
        if not self.navigate_to_page(driver, self.customer_url, "Cliente"):
            raise Exception("Navigate failed")
        driver.save_screenshot("20_customers.png")
        
        if not self.find_and_click(driver, "Exportar"):
            raise Exception("Export button not found")
        
        file = self.wait_for_download()
        if file:
            logging.info(f"✅ Customers: {os.path.basename(file)}")
            return file
        raise Exception("Download timeout")
    
    def wait_for_download(self, timeout=30):
        initial = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start = time.time()
        while time.time() - start < timeout:
            current = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new = current - initial
            for f in new:
                if not f.endswith(('.crdownload', '.tmp')):
                    try:
                        if os.path.getsize(f) > 0:
                            time.sleep(1)
                            return f
                    except:
                        pass
            time.sleep(1)
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        creds = Credentials.from_authorized_user_info(json.loads(self.google_creds_json))
        service = build('drive', 'v3', credentials=creds)
        
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        filename = f"{file_type}_{yesterday}.csv"
        
        media = MediaFileUpload(file_path, mimetype='text/csv', resumable=True)
        updated = service.files().update(
            fileId=file_id,
            body={'name': filename},
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()
        
        logging.info(f"✅ Uploaded: {updated.get('name')}")
        return updated
    
    def run(self):
        try:
            logging.info("="*60)
            logging.info(f"🚀 LAVAPOP v{VERSION}")
            logging.info("="*60)
            
            self.driver = self.setup_driver()
            self.login(self.driver)
            
            sales = self.export_sales(self.driver)
            customers = self.export_customers(self.driver)
            
            if sales:
                self.upload_to_google_drive(sales, self.sales_file_id, "sales")
            if customers:
                self.upload_to_google_drive(customers, self.customer_file_id, "customers")
            
            logging.info("="*60)
            logging.info("✅ SUCCESS!")
            logging.info("="*60)
            return True
            
        except Exception as e:
            logging.error(f"❌ FAILED: {e}", exc_info=True)
            return False
        finally:
            if self.driver:
                self.driver.quit()

def main():
    success = LavapopAutomation().run()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
