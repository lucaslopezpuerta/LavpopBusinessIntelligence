from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from twocaptcha import TwoCaptcha
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import json
import time
from datetime import datetime, timedelta
import os
import logging
import glob

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pos_automation.log'),
        logging.StreamHandler()
    ]
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
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        prefs = {"download.default_directory": self.download_dir, "download.prompt_for_download": False}
        chrome_options.add_experimental_option("prefs", prefs)
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": 'Mozilla/5.0'})
        
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}}
        driver.execute("send_command", params)
        
        return driver
    
    def is_logged_in(self, driver):
        current_url = driver.current_url
        if current_url.startswith(f"{self.base_url}/system"):
            return True
        return False
    
    def has_captcha_error(self, driver):
        """Check if form shows CAPTCHA error"""
        try:
            body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
            return "preencha o captcha" in body_text
        except:
            return False
    
    def solve_captcha_and_wait(self, driver):
        """Solve CAPTCHA and wait until form accepts it"""
        logging.info("Solving CAPTCHA...")
        
        try:
            time.sleep(2)
            
            # Get site key
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            site_key = None
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src and "k=" in src:
                    site_key = src.split("k=")[1].split("&")[0]
                    break
            
            if not site_key:
                raise Exception("Site key not found")
            
            logging.info(f"Site key: {site_key}")
            logging.info("Sending to 2Captcha (30-60s)...")
            
            # Solve
            result = self.solver.recaptcha(sitekey=site_key, url=driver.current_url)
            token = result['code']
            logging.info(f"✅ Token received ({len(token)} chars)")
            
            # Inject and trigger - attempt multiple times if needed
            max_attempts = 3
            for attempt in range(max_attempts):
                logging.info(f"Injection attempt {attempt + 1}/{max_attempts}")
                
                # Inject token
                driver.execute_script(f'''
                    var token = "{token}";
                    document.getElementById("g-recaptcha-response").innerHTML = token;
                    var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                    if (textarea) {{
                        textarea.value = token;
                        textarea.innerHTML = token;
                    }}
                ''')
                
                # Trigger all callbacks
                driver.execute_script(f'''
                    var token = "{token}";
                    
                    // Trigger grecaptcha callbacks
                    if (typeof ___grecaptcha_cfg !== 'undefined') {{
                        Object.keys(___grecaptcha_cfg.clients).forEach(function(clientId) {{
                            var client = ___grecaptcha_cfg.clients[clientId];
                            Object.keys(client).forEach(function(widgetId) {{
                                var widget = client[widgetId];
                                if (widget && widget.callback) {{
                                    widget.callback(token);
                                }}
                            }});
                        }});
                    }}
                    
                    // Trigger data-callback
                    var recaptchaDiv = document.querySelector('.g-recaptcha');
                    if (recaptchaDiv) {{
                        var callbackName = recaptchaDiv.getAttribute('data-callback');
                        if (callbackName && typeof window[callbackName] === 'function') {{
                            window[callbackName](token);
                        }}
                    }}
                ''')
                
                logging.info(f"Token injected, waiting 5 seconds...")
                time.sleep(5)
                
                # Check if error still appears
                if not self.has_captcha_error(driver):
                    logging.info("✅ Form accepts CAPTCHA")
                    break
                else:
                    logging.warning(f"Form still shows error (attempt {attempt + 1})")
                    if attempt < max_attempts - 1:
                        logging.info("Retrying injection...")
                    else:
                        logging.error("Form won't accept CAPTCHA after 3 attempts")
                        return False
            
            driver.save_screenshot(os.path.join(self.download_dir, "captcha_ready.png"))
            return True
            
        except Exception as e:
            logging.error(f"❌ CAPTCHA failed: {e}")
            return False
    
    def login(self, driver):
        logging.info("="*60)
        logging.info("LOGIN")
        logging.info("="*60)
        
        try:
            driver.get(self.pos_url)
            time.sleep(3)
            driver.save_screenshot(os.path.join(self.download_dir, "01_login_page.png"))
            
            if self.is_logged_in(driver):
                logging.info("✅ Already logged in")
                return True
            
            # Username
            email_field = None
            for selector in ['input[name="email"]', 'input[type="email"]', 'input[type="text"]']:
                try:
                    fields = driver.find_elements(By.CSS_SELECTOR, selector)
                    for field in fields:
                        if field.is_displayed():
                            email_field = field
                            break
                    if email_field:
                        break
                except:
                    continue
            
            if not email_field:
                raise Exception("Email field not found")
            
            email_field.clear()
            email_field.send_keys(self.username)
            logging.info("✅ Username")
            
            # Password
            password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
            password_field.clear()
            password_field.send_keys(self.password)
            logging.info("✅ Password")
            time.sleep(1)
            
            driver.save_screenshot(os.path.join(self.download_dir, "02_credentials.png"))
            
            # Solve CAPTCHA and wait for form acceptance
            if not self.solve_captcha_and_wait(driver):
                raise Exception("CAPTCHA not accepted by form")
            
            # Now safe to submit
            logging.info("Submitting form...")
            time.sleep(2)  # Extra safety wait
            
            driver.save_screenshot(os.path.join(self.download_dir, "03_before_submit.png"))
            
            # Check one more time
            if self.has_captcha_error(driver):
                raise Exception("CAPTCHA error still present before submit")
            
            # Submit
            try:
                password_field.send_keys(Keys.RETURN)
                logging.info("✅ Submitted (Enter)")
            except:
                button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
                button.click()
                logging.info("✅ Submitted (button)")
            
            # Wait for redirect
            logging.info("Waiting for redirect to /system...")
            dashboard_url = f"{self.base_url}/system"
            
            for i in range(20):
                time.sleep(1)
                if driver.current_url.startswith(dashboard_url):
                    logging.info(f"✅ Redirected ({i+1}s)")
                    driver.save_screenshot(os.path.join(self.download_dir, "04_dashboard.png"))
                    break
                if i % 5 == 0 and i > 0:
                    logging.info(f"Waiting... ({i+1}/20s)")
            
            time.sleep(2)
            
            if self.is_logged_in(driver):
                logging.info("="*60)
                logging.info("✅ LOGIN SUCCESS")
                logging.info("="*60)
                return True
            else:
                raise Exception(f"No redirect: still at {driver.current_url}")
                
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_login.png"))
            raise
    
    def navigate_to_page(self, driver, direct_url, sidebar_text, page_name):
        try:
            driver.get(direct_url)
            time.sleep(3)
            if sidebar_text.lower() in driver.page_source.lower():
                return True
        except:
            pass
        
        try:
            link = driver.find_element(By.PARTIAL_LINK_TEXT, sidebar_text)
            link.click()
            time.sleep(3)
            return True
        except:
            return False
    
    def find_and_click(self, driver, text):
        try:
            elements = driver.find_elements(By.XPATH, f"//*[contains(text(), '{text}')]")
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    elem.click()
                    return True
            return False
        except:
            return False
    
    def export_sales(self, driver):
        try:
            if not self.navigate_to_page(driver, self.sales_url, "Venda", "Sales"):
                raise Exception("Navigation failed")
            
            driver.save_screenshot(os.path.join(self.download_dir, "10_sales.png"))
            
            if self.find_and_click(driver, "Ontem"):
                time.sleep(2)
                buttons = driver.find_elements(By.XPATH, "//*[text()='Ontem']")
                if len(buttons) > 1:
                    try:
                        buttons[1].click()
                    except:
                        pass
                self.find_and_click(driver, "Aplicar")
                time.sleep(2)
            
            self.find_and_click(driver, "Buscar")
            time.sleep(4)
            
            if not self.find_and_click(driver, "Exportar"):
                raise Exception("Export not found")
            
            file = self.wait_for_download(30)
            if file:
                logging.info(f"✅ Sales: {os.path.basename(file)}")
                return file
            raise Exception("Download timeout")
            
        except Exception as e:
            logging.error(f"❌ Sales: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_sales.png"))
            raise
    
    def export_customers(self, driver):
        try:
            if not self.navigate_to_page(driver, self.customer_url, "Cliente", "Customers"):
                raise Exception("Navigation failed")
            
            driver.save_screenshot(os.path.join(self.download_dir, "20_customers.png"))
            
            if not self.find_and_click(driver, "Exportar"):
                raise Exception("Export not found")
            
            file = self.wait_for_download(30)
            if file:
                logging.info(f"✅ Customers: {os.path.basename(file)}")
                return file
            raise Exception("Download timeout")
            
        except Exception as e:
            logging.error(f"❌ Customers: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_customers.png"))
            raise
    
    def wait_for_download(self, timeout=30):
        initial = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start = time.time()
        
        while time.time() - start < timeout:
            current = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new = current - initial
            for file in new:
                if not file.endswith(('.crdownload', '.tmp')):
                    if os.path.getsize(file) > 0:
                        time.sleep(1)
                        return file
            time.sleep(1)
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        try:
            creds_dict = json.loads(self.google_creds_json)
            creds = Credentials.from_authorized_user_info(creds_dict)
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
            
            logging.info(f"✅ {updated.get('name')}")
            return updated
        except Exception as e:
            logging.error(f"❌ Upload: {e}")
            raise
    
    def run(self):
        try:
            logging.info("LAVAPOP AUTOMATION")
            
            self.driver = self.setup_driver()
            self.login(self.driver)
            
            sales = self.export_sales(self.driver)
            customers = self.export_customers(self.driver)
            
            if sales:
                self.upload_to_google_drive(sales, self.sales_file_id, "sales")
            if customers:
                self.upload_to_google_drive(customers, self.customer_file_id, "customers")
            
            logging.info("✅ SUCCESS")
            return True
            
        except Exception as e:
            logging.error(f"❌ FAILED: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

def main():
    automation = LavapopAutomation()
    success = automation.run()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
