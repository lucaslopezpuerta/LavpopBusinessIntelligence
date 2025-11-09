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
import json
import time
from datetime import datetime, timedelta
import os
import logging
import glob

# Setup logging
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
        
        # Load environment variables
        self.captcha_api_key = os.getenv('CAPTCHA_API_KEY')
        self.solver = TwoCaptcha(self.captcha_api_key)
        
        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')
        
        # Google Drive settings
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        
        self.driver = None
        
    def setup_driver(self):
        """Configure Chrome for GitHub Actions"""
        chrome_options = Options()
        
        # Required for GitHub Actions
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        # Download settings
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
        driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Enable downloads in headless mode
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}}
        driver.execute("send_command", params)
        
        return driver
    
    def solve_captcha(self, driver):
        """Auto-detect and solve CAPTCHA using 2Captcha"""
        logging.info("Detecting CAPTCHA type...")
        time.sleep(2)
        
        # Try to find reCAPTCHA v2
        try:
            site_key_element = driver.find_element(By.CSS_SELECTOR, ".g-recaptcha, iframe[src*='recaptcha']")
            
            # Get site key
            site_key = None
            if site_key_element.tag_name == "div":
                site_key = site_key_element.get_attribute("data-sitekey")
            else:
                # Extract from iframe src
                iframe_src = site_key_element.get_attribute("src")
                if "k=" in iframe_src:
                    site_key = iframe_src.split("k=")[1].split("&")[0]
            
            if site_key:
                logging.info(f"Found reCAPTCHA v2 with site key: {site_key}")
                
                result = self.solver.recaptcha(
                    sitekey=site_key,
                    url=driver.current_url
                )
                
                # Inject solution
                driver.execute_script(
                    f'document.getElementById("g-recaptcha-response").innerHTML="{result["code"]}";'
                )
                
                # Try to submit
                driver.execute_script(
                    """
                    if (typeof ___grecaptcha_cfg !== 'undefined') {
                        var widgets = ___grecaptcha_cfg.clients[0];
                        if (widgets && Object.keys(widgets).length > 0) {
                            var widgetId = Object.keys(widgets)[0];
                            if (widgets[widgetId].callback) {
                                widgets[widgetId].callback(arguments[0]);
                            }
                        }
                    }
                    """, result["code"]
                )
                
                logging.info("✅ reCAPTCHA v2 solved successfully")
                return True
                
        except NoSuchElementException:
            logging.info("No reCAPTCHA v2 found, checking for other types...")
        
        # Try to find hCaptcha
        try:
            site_key_element = driver.find_element(By.CSS_SELECTOR, ".h-captcha, iframe[src*='hcaptcha']")
            
            site_key = None
            if site_key_element.tag_name == "div":
                site_key = site_key_element.get_attribute("data-sitekey")
            else:
                iframe_src = site_key_element.get_attribute("src")
                if "sitekey=" in iframe_src:
                    site_key = iframe_src.split("sitekey=")[1].split("&")[0]
            
            if site_key:
                logging.info(f"Found hCaptcha with site key: {site_key}")
                
                result = self.solver.hcaptcha(
                    sitekey=site_key,
                    url=driver.current_url
                )
                
                driver.execute_script(
                    f'document.querySelector("[name=h-captcha-response]").innerHTML="{result["code"]}";'
                )
                
                logging.info("✅ hCaptcha solved successfully")
                return True
                
        except NoSuchElementException:
            logging.warning("⚠️ No CAPTCHA detected")
        
        return True
    
    def login(self, driver):
        """Login to Lavapop POS"""
        logging.info("Starting login process...")
        
        driver.get(self.pos_url)
        time.sleep(3)
        
        try:
            # Find and fill username (try multiple selectors)
            username_field = None
            for selector in ['input[name="username"]', 'input[type="text"]', '#username', 'input[placeholder*="usuário"]']:
                try:
                    username_field = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if not username_field:
                raise Exception("Username field not found")
            
            username_field.clear()
            username_field.send_keys(self.username)
            logging.info("✅ Username entered")
            
            # Find and fill password
            password_field = None
            for selector in ['input[name="password"]', 'input[type="password"]', '#password', 'input[placeholder*="senha"]']:
                try:
                    password_field = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if not password_field:
                raise Exception("Password field not found")
            
            password_field.clear()
            password_field.send_keys(self.password)
            logging.info("✅ Password entered")
            
            # Solve CAPTCHA if present
            self.solve_captcha(driver)
            time.sleep(2)
            
            # Find and click login button
            login_button = None
            for selector in ['button[type="submit"]', 'button:contains("Entrar")', '.btn-login', 'input[type="submit"]']:
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if not login_button:
                # Try finding by text
                buttons = driver.find_elements(By.TAG_NAME, "button")
                for btn in buttons:
                    if "entrar" in btn.text.lower() or "login" in btn.text.lower():
                        login_button = btn
                        break
            
            if not login_button:
                raise Exception("Login button not found")
            
            login_button.click()
            logging.info("✅ Login button clicked")
            
            # Wait for successful login (dashboard should load)
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.LINK_TEXT, "Vendas"))
            )
            
            logging.info("✅ Login successful!")
            return True
            
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "login_error.png"))
            raise
    
    def export_sales(self, driver):
        """Export yesterday's sales data"""
        logging.info("Exporting sales data...")
        
        try:
            # Click on "Vendas" in sidebar
            vendas_link = driver.find_element(By.LINK_TEXT, "Vendas")
            vendas_link.click()
            time.sleep(3)
            
            logging.info("✅ Navigated to Sales page")
            
            # Click on period dropdown to select "Ontem" (Yesterday)
            period_dropdown = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ontem') or contains(text(), 'Período')]"))
            )
            period_dropdown.click()
            time.sleep(1)
            
            # Select "Ontem" (Yesterday)
            try:
                yesterday_option = driver.find_element(By.XPATH, "//button[text()='Ontem'] | //div[text()='Ontem']")
                yesterday_option.click()
                logging.info("✅ Selected 'Ontem' (Yesterday)")
            except:
                logging.info("Yesterday already selected")
            
            time.sleep(1)
            
            # Click "Aplicar" if modal is present
            try:
                apply_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Aplicar')]")
                apply_button.click()
                time.sleep(2)
            except:
                logging.info("No apply button needed")
            
            # Click "Buscar" button to apply filters
            try:
                buscar_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Buscar')]"))
                )
                buscar_button.click()
                time.sleep(3)
                logging.info("✅ Clicked 'Buscar' to apply filters")
            except:
                logging.info("No search button or already applied")
            
            # Click "Exportar" button
            export_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Exportar')]"))
            )
            export_button.click()
            logging.info("✅ Clicked 'Exportar' button")
            
            # Wait for download
            sales_file = self.wait_for_download("vendas", timeout=30)
            
            if sales_file:
                logging.info(f"✅ Sales file downloaded: {sales_file}")
                return sales_file
            else:
                raise Exception("Sales file download timeout")
                
        except Exception as e:
            logging.error(f"❌ Sales export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "sales_error.png"))
            raise
    
    def export_customers(self, driver):
        """Export customer data"""
        logging.info("Exporting customer data...")
        
        try:
            # Click on "Clientes" in sidebar
            clientes_link = driver.find_element(By.LINK_TEXT, "Clientes")
            clientes_link.click()
            time.sleep(3)
            
            logging.info("✅ Navigated to Customers page")
            
            # Click "Exportar" button
            export_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Exportar')]"))
            )
            export_button.click()
            logging.info("✅ Clicked 'Exportar' button")
            
            # Wait for download
            customer_file = self.wait_for_download("clientes", timeout=30)
            
            if customer_file:
                logging.info(f"✅ Customer file downloaded: {customer_file}")
                return customer_file
            else:
                raise Exception("Customer file download timeout")
                
        except Exception as e:
            logging.error(f"❌ Customer export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "customer_error.png"))
            raise
    
    def wait_for_download(self, filename_contains, timeout=30):
        """Wait for a file to be downloaded"""
        logging.info(f"Waiting for download containing '{filename_contains}'...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            # Look for CSV files
            files = glob.glob(os.path.join(self.download_dir, "*.csv"))
            
            # Filter for relevant files
            for file in files:
                if filename_contains.lower() in os.path.basename(file).lower():
                    # Check if file is complete (not .crdownload or .tmp)
                    if not file.endswith('.crdownload') and not file.endswith('.tmp'):
                        return file
            
            time.sleep(1)
        
        # If timeout, return the most recent CSV file
        files = glob.glob(os.path.join(self.download_dir, "*.csv"))
        if files:
            return max(files, key=os.path.getctime)
        
        return None
    
    def upload_to_google_drive(self, file_path, file_id):
        """Upload or update file in Google Drive"""
        logging.info(f"Uploading {file_path} to Google Drive...")
        
        try:
            # Parse credentials from JSON string
            creds_dict = json.loads(self.google_creds_json)
            creds = Credentials.from_authorized_user_info(creds_dict)
            
            # Build Drive API service
            service = build('drive', 'v3', credentials=creds)
            
            # Get filename
            filename = os.path.basename(file_path)
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            new_filename = f"{filename.split('.')[0]}_{yesterday}.csv"
            
            # Upload file
            media = MediaFileUpload(file_path, mimetype='text/csv', resumable=True)
            
            file_metadata = {
                'name': new_filename
            }
            
            # Update existing file
            updated_file = service.files().update(
                fileId=file_id,
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink'
            ).execute()
            
            logging.info(f"✅ File uploaded to Google Drive: {updated_file.get('name')}")
            logging.info(f"📎 Link: {updated_file.get('webViewLink')}")
            
            return updated_file
            
        except Exception as e:
            logging.error(f"❌ Google Drive upload failed: {e}")
            raise
    
    def run(self):
        """Main execution flow"""
        try:
            logging.info("="*60)
            logging.info("Starting Lavapop POS Automation")
            logging.info("="*60)
            
            # Setup driver
            self.driver = self.setup_driver()
            
            # Login
            self.login(self.driver)
            
            # Export sales
            sales_file = self.export_sales(self.driver)
            
            # Export customers
            customer_file = self.export_customers(self.driver)
            
            # Upload to Google Drive
            if sales_file:
                self.upload_to_google_drive(sales_file, self.sales_file_id)
            
            if customer_file:
                self.upload_to_google_drive(customer_file, self.customer_file_id)
            
            logging.info("="*60)
            logging.info("✅ Automation completed successfully!")
            logging.info("="*60)
            
            return True
            
        except Exception as e:
            logging.error(f"❌ Automation failed: {e}", exc_info=True)
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
