"""
Lavapop POS Automation - v1.6
Uses proven CAPTCHA callback from working version + direct URL navigation
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

VERSION = "1.6"

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
        logging.info(f"LAVAPOP POS AUTOMATION v{VERSION}")
        logging.info("="*70)
        
    def setup_driver(self):
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--disable-gpu')
        opts.add_argument('--window-size=1920,1080')
        opts.add_argument('--disable-blink-features=AutomationControlled')
        opts.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        prefs = {
            "download.default_directory": self.download_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": False
        }
        opts.add_experimental_option("prefs", prefs)
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=opts)
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}}
        driver.execute("send_command", params)
        
        return driver
    
    def find_clickable_element(self, text):
        """Find clickable element by text with multiple strategies"""
        strategies = [
            (By.XPATH, f"//*[contains(text(), '{text}')]"),
            (By.PARTIAL_LINK_TEXT, text),
            (By.LINK_TEXT, text),
        ]
        
        for by, selector in strategies:
            try:
                elements = self.driver.find_elements(by, selector)
                for elem in elements:
                    if elem.is_displayed() and elem.is_enabled():
                        return elem
            except:
                continue
        return None
    
    def solve_recaptcha_v2(self):
        """Solve reCAPTCHA v2 using proven callback method"""
        logging.info("Detecting reCAPTCHA v2...")
        
        try:
            time.sleep(2)
            
            # Find site key from iframe
            iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
            site_key = None
            
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src:
                    logging.info(f"Found reCAPTCHA iframe: {src}")
                    if "k=" in src:
                        site_key = src.split("k=")[1].split("&")[0]
                        break
            
            if not site_key:
                try:
                    recaptcha_div = self.driver.find_element(By.CLASS_NAME, "g-recaptcha")
                    site_key = recaptcha_div.get_attribute("data-sitekey")
                except:
                    pass
            
            if not site_key:
                raise Exception("Could not find reCAPTCHA site key")
            
            logging.info(f"Found reCAPTCHA site key: {site_key}")
            logging.info("Sending CAPTCHA to 2Captcha for solving...")
            
            # Solve with 2Captcha
            result = self.solver.recaptcha(sitekey=site_key, url=self.driver.current_url)
            captcha_response = result['code']
            logging.info(f"✅ CAPTCHA solved! Response token: {captcha_response[:40]}...")
            
            # Inject solution into textarea
            self.driver.execute_script(f'''
                document.getElementById("g-recaptcha-response").innerHTML="{captcha_response}";
                var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                if (textarea) {{
                    textarea.innerHTML = "{captcha_response}";
                    textarea.value = "{captcha_response}";
                }}
            ''')
            
            logging.info("✅ reCAPTCHA solution injected")
            
            # CRITICAL: Trigger callback via ___grecaptcha_cfg (proven working method)
            self.driver.execute_script(f'''
                if (typeof ___grecaptcha_cfg !== 'undefined') {{
                    var clients = ___grecaptcha_cfg.clients;
                    for (var client in clients) {{
                        var widgets = clients[client];
                        for (var widget in widgets) {{
                            if (widgets[widget] && widgets[widget].callback) {{
                                widgets[widget].callback("{captcha_response}");
                            }}
                        }}
                    }}
                }}
            ''')
            
            time.sleep(1)
            logging.info("✅ reCAPTCHA callback executed")
            return True
            
        except Exception as e:
            logging.error(f"❌ reCAPTCHA solving failed: {e}")
            return False
    
    def login(self):
        """Login to Lavapop POS"""
        logging.info("Starting login process...")
        
        try:
            self.driver.get(self.pos_url)
            logging.info(f"Navigated to: {self.pos_url}")
            time.sleep(3)
            
            self.driver.save_screenshot("01_login_page.png")
            
            # Find and fill email field
            email_field = None
            for selector in ['input[type="email"]', 'input[type="text"]', 'input[name="email"]']:
                try:
                    email_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if email_field.is_displayed():
                        logging.info(f"✅ Found email field by attributes: {selector}")
                        break
                except:
                    continue
            
            if not email_field:
                raise Exception("Email field not found")
            
            email_field.clear()
            email_field.send_keys(self.username)
            logging.info("✅ Username entered")
            time.sleep(1)
            
            # Find and fill password field
            password_field = self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
            password_field.clear()
            password_field.send_keys(self.password)
            logging.info("✅ Password entered")
            time.sleep(1)
            
            self.driver.save_screenshot("02_credentials_filled.png")
            
            # Solve reCAPTCHA
            if not self.solve_recaptcha_v2():
                raise Exception("CAPTCHA solving failed")
            
            time.sleep(2)
            self.driver.save_screenshot("03_captcha_solved.png")
            
            # Find and click submit button with multiple methods
            logging.info("Looking for 'Entrar' button...")
            
            submit_button = None
            
            # Method 1: By text content
            submit_button = self.find_clickable_element("Entrar")
            if submit_button:
                logging.info("✅ Found 'Entrar' button by text")
            
            # Method 2: By type
            if not submit_button:
                try:
                    buttons = self.driver.find_elements(By.CSS_SELECTOR, "button[type='submit']")
                    for btn in buttons:
                        if btn.is_displayed():
                            submit_button = btn
                            logging.info("✅ Found submit button by type")
                            break
                except:
                    pass
            
            # Method 3: Any button
            if not submit_button:
                try:
                    buttons = self.driver.find_elements(By.TAG_NAME, "button")
                    for btn in buttons:
                        if btn.is_displayed() and "entrar" in btn.text.lower():
                            submit_button = btn
                            logging.info("✅ Found button containing 'entrar'")
                            break
                except:
                    pass
            
            if not submit_button:
                raise Exception("Submit button not found")
            
            # Click with multiple methods
            logging.info("Attempting to click login button...")
            clicked = False
            
            # Try regular click
            try:
                submit_button.click()
                clicked = True
                logging.info("✅ Login button clicked (regular click)")
            except:
                pass
            
            # Try JavaScript click
            if not clicked:
                try:
                    self.driver.execute_script("arguments[0].click();", submit_button)
                    clicked = True
                    logging.info("✅ Login button clicked (JavaScript)")
                except:
                    pass
            
            # Try action chains
            if not clicked:
                try:
                    from selenium.webdriver.common.action_chains import ActionChains
                    ActionChains(self.driver).move_to_element(submit_button).click().perform()
                    clicked = True
                    logging.info("✅ Login button clicked (ActionChains)")
                except:
                    pass
            
            if not clicked:
                raise Exception("Could not click submit button")
            
            time.sleep(2)
            self.driver.save_screenshot("04_after_click.png")
            
            # Wait for redirect
            logging.info("Waiting for redirect...")
            
            initial_url = self.driver.current_url
            redirect_timeout = 30
            start_time = time.time()
            
            while time.time() - start_time < redirect_timeout:
                current_url = self.driver.current_url
                
                # Check if URL changed
                if current_url != initial_url and 'login' not in current_url.lower():
                    logging.info(f"✅ Login appears successful (URL changed)")
                    logging.info(f"Current URL after login: {current_url}")
                    break
                
                time.sleep(1)
            
            time.sleep(3)
            self.driver.save_screenshot("05_after_login.png")
            
            # Verify login success
            current_url = self.driver.current_url
            if 'login' in current_url.lower():
                raise Exception("Still on login page after submit")
            
            logging.info("✅ Login successful!")
            logging.info("="*70)
            return True
            
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            self.driver.save_screenshot("error_login.png")
            raise
    
    def export_sales(self):
        """Export sales data"""
        logging.info("="*70)
        logging.info("Starting sales export...")
        logging.info("="*70)
        
        try:
            # Navigate directly to sales page
            logging.info(f"Step 1: Navigating to: {self.sales_url}")
            self.driver.get(self.sales_url)
            time.sleep(4)
            self.driver.save_screenshot("06_sales_page.png")
            logging.info("✅ On sales page")
            
            # Click period selector
            logging.info("Step 2: Looking for period selector...")
            period_btn = self.find_clickable_element("Ontem")
            
            if not period_btn:
                raise Exception("Period selector 'Ontem' not found")
            
            period_btn.click()
            logging.info("✅ Clicked period selector")
            time.sleep(2)
            self.driver.save_screenshot("07_period_menu_open.png")
            
            # Click "Ontem" option in dropdown
            logging.info("Step 3: Selecting 'Ontem' from dropdown...")
            ontem_options = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
            
            if len(ontem_options) > 1:
                ontem_options[1].click()
                logging.info("✅ Selected 'Ontem' option")
            else:
                logging.warning("Only one 'Ontem' element found")
            
            time.sleep(1)
            
            # Click "Aplicar"
            logging.info("Step 4: Looking for 'Aplicar' button...")
            aplicar = self.find_clickable_element("Aplicar")
            
            if not aplicar:
                raise Exception("'Aplicar' button not found")
            
            aplicar.click()
            logging.info("✅ Clicked 'Aplicar'")
            time.sleep(2)
            self.driver.save_screenshot("08_period_applied.png")
            
            # Click "Buscar"
            logging.info("Step 5: Looking for 'Buscar' button...")
            buscar = self.find_clickable_element("Buscar")
            
            if not buscar:
                raise Exception("'Buscar' button not found")
            
            buscar.click()
            logging.info("✅ Clicked 'Buscar'")
            time.sleep(4)
            self.driver.save_screenshot("09_search_complete.png")
            
            # Click "Exportar"
            logging.info("Step 6: Looking for 'Exportar' button...")
            exportar = self.find_clickable_element("Exportar")
            
            if not exportar:
                raise Exception("'Exportar' button not found")
            
            exportar.click()
            logging.info("✅ Clicked 'Exportar'")
            
            # Wait for download
            sales_file = self.wait_for_download("", timeout=30)
            
            if not sales_file:
                raise Exception("Sales file download timeout")
            
            logging.info(f"✅ Sales file downloaded: {os.path.basename(sales_file)}")
            self.driver.save_screenshot("10_sales_exported.png")
            logging.info("="*70)
            return sales_file
                
        except Exception as e:
            logging.error(f"❌ Sales export failed: {e}")
            self.driver.save_screenshot("error_sales.png")
            raise
    
    def export_customers(self):
        """Export customer data"""
        logging.info("="*70)
        logging.info("Starting customer export...")
        logging.info("="*70)
        
        try:
            # Navigate directly to customers page
            logging.info(f"Step 1: Navigating to: {self.customer_url}")
            self.driver.get(self.customer_url)
            time.sleep(4)
            self.driver.save_screenshot("11_customers_page.png")
            logging.info("✅ On customers page")
            
            # Click "Exportar"
            logging.info("Step 2: Looking for 'Exportar' button...")
            exportar = self.find_clickable_element("Exportar")
            
            if not exportar:
                raise Exception("'Exportar' button not found")
            
            exportar.click()
            logging.info("✅ Clicked 'Exportar'")
            
            # Wait for download
            customer_file = self.wait_for_download("", timeout=30)
            
            if not customer_file:
                raise Exception("Customer file download timeout")
            
            logging.info(f"✅ Customer file downloaded: {os.path.basename(customer_file)}")
            self.driver.save_screenshot("12_customers_exported.png")
            logging.info("="*70)
            return customer_file
                
        except Exception as e:
            logging.error(f"❌ Customer export failed: {e}")
            self.driver.save_screenshot("error_customers.png")
            raise
    
    def wait_for_download(self, filename_contains, timeout=30):
        """Wait for file download"""
        logging.info(f"Waiting for download (filter: '{filename_contains}')...")
        
        initial_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            current_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new_files = current_files - initial_files
            
            for file in new_files:
                if file.endswith('.crdownload') or file.endswith('.tmp'):
                    continue
                
                if os.path.getsize(file) > 0:
                    basename = os.path.basename(file).lower()
                    
                    if not filename_contains:
                        logging.info(f"Found new file: {basename}")
                        time.sleep(1)  # Extra wait for file completion
                        return file
                    
                    if filename_contains.lower() in basename:
                        logging.info(f"Found matching file: {basename}")
                        time.sleep(1)
                        return file
            
            time.sleep(1)
        
        # Timeout fallback
        if not filename_contains:
            all_files = glob.glob(os.path.join(self.download_dir, "*.csv"))
            if all_files:
                most_recent = max(all_files, key=os.path.getctime)
                logging.warning(f"Timeout - returning most recent: {os.path.basename(most_recent)}")
                return most_recent
        
        logging.error(f"Download timeout (looking for '{filename_contains}')")
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        """Upload file to Google Drive"""
        logging.info(f"Uploading {file_type} to Google Drive...")
        
        try:
            creds_dict = json.loads(self.google_creds_json)
            creds = Credentials.from_authorized_user_info(creds_dict)
            service = build('drive', 'v3', credentials=creds)
            
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            new_filename = f"{file_type}_{yesterday}.csv"
            
            media = MediaFileUpload(file_path, mimetype='text/csv', resumable=True)
            file_metadata = {'name': new_filename}
            
            updated_file = service.files().update(
                fileId=file_id,
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink'
            ).execute()
            
            logging.info(f"✅ Uploaded: {updated_file.get('name')}")
            logging.info(f"📎 Link: {updated_file.get('webViewLink')}")
            
            return updated_file
            
        except Exception as e:
            logging.error(f"❌ Google Drive upload failed: {e}")
            raise
    
    def run(self):
        """Main execution"""
        try:
            self.driver = self.setup_driver()
            
            # Login
            self.login()
            
            # Export sales
            sales_file = self.export_sales()
            
            # Export customers
            customer_file = self.export_customers()
            
            # Upload to Google Drive
            if sales_file:
                self.upload_to_google_drive(sales_file, self.sales_file_id, "sales")
            
            if customer_file:
                self.upload_to_google_drive(customer_file, self.customer_file_id, "customers")
            
            logging.info("="*70)
            logging.info("✅ AUTOMATION COMPLETED SUCCESSFULLY!")
            logging.info("="*70)
            
            return True
            
        except Exception as e:
            logging.error(f"❌ AUTOMATION FAILED: {e}", exc_info=True)
            return False
            
        finally:
            if self.driver:
                self.driver.quit()
                logging.info("Browser closed")

def main():
    automation = LavapopAutomation()
    success = automation.run()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
