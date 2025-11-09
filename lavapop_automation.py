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
    
    def solve_recaptcha_v2(self, driver):
        """Solve reCAPTCHA v2 using 2Captcha"""
        logging.info("Detecting reCAPTCHA v2...")
        
        try:
            # Wait for reCAPTCHA iframe to load
            time.sleep(2)
            
            # Find reCAPTCHA iframe
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            site_key = None
            
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src:
                    logging.info(f"Found reCAPTCHA iframe: {src}")
                    # Extract site key from iframe src
                    if "k=" in src:
                        site_key = src.split("k=")[1].split("&")[0]
                        break
            
            # Alternative: Look for div with data-sitekey
            if not site_key:
                try:
                    recaptcha_div = driver.find_element(By.CLASS_NAME, "g-recaptcha")
                    site_key = recaptcha_div.get_attribute("data-sitekey")
                except:
                    pass
            
            if not site_key:
                logging.error("Could not find reCAPTCHA site key")
                # Save page source for debugging
                with open("page_source.html", "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
                return False
            
            logging.info(f"Found reCAPTCHA site key: {site_key}")
            logging.info("Sending CAPTCHA to 2Captcha for solving...")
            
            # Solve with 2Captcha
            result = self.solver.recaptcha(
                sitekey=site_key,
                url=driver.current_url
            )
            
            captcha_response = result['code']
            logging.info(f"✅ CAPTCHA solved! Response token: {captcha_response[:50]}...")
            
            # Inject the solution
            driver.execute_script(
                f'''
                document.getElementById("g-recaptcha-response").innerHTML="{captcha_response}";
                '''
            )
            
            # Also try to set textarea (some implementations use textarea)
            driver.execute_script(
                f'''
                var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                if (textarea) {{
                    textarea.innerHTML = "{captcha_response}";
                    textarea.value = "{captcha_response}";
                }}
                '''
            )
            
            # Trigger callback if exists
            driver.execute_script(
                f'''
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
                '''
            )
            
            time.sleep(1)
            logging.info("✅ reCAPTCHA solution injected")
            return True
            
        except Exception as e:
            logging.error(f"❌ reCAPTCHA solving failed: {e}")
            return False
    
    def login(self, driver):
        """Login to Lavapop POS"""
        logging.info("Starting login process...")
        
        try:
            driver.get(self.pos_url)
            logging.info(f"Navigated to: {self.pos_url}")
            time.sleep(3)
            
            # Take screenshot for debugging
            driver.save_screenshot(os.path.join(self.download_dir, "01_login_page.png"))
            
            # Find email field - try multiple strategies
            email_field = None
            
            # Strategy 1: Look for input with type="email"
            try:
                email_field = driver.find_element(By.CSS_SELECTOR, 'input[type="email"]')
                logging.info("✅ Found email field by type='email'")
            except:
                pass
            
            # Strategy 2: Look for input near label "E-mail"
            if not email_field:
                try:
                    # Find all inputs
                    inputs = driver.find_elements(By.TAG_NAME, "input")
                    for inp in inputs:
                        input_type = inp.get_attribute("type")
                        placeholder = inp.get_attribute("placeholder") or ""
                        name = inp.get_attribute("name") or ""
                        
                        if (input_type == "text" or input_type == "email") and \
                           ("mail" in placeholder.lower() or "mail" in name.lower()):
                            email_field = inp
                            logging.info(f"✅ Found email field by attributes: {name}, {placeholder}")
                            break
                except:
                    pass
            
            # Strategy 3: First visible input field
            if not email_field:
                try:
                    inputs = driver.find_elements(By.CSS_SELECTOR, 'input[type="text"], input:not([type])')
                    for inp in inputs:
                        if inp.is_displayed():
                            email_field = inp
                            logging.info("✅ Found email field as first visible input")
                            break
                except:
                    pass
            
            if not email_field:
                raise Exception("Username field not found")
            
            email_field.clear()
            email_field.send_keys(self.username)
            logging.info("✅ Username entered")
            time.sleep(1)
            
            # Find password field
            password_field = None
            
            try:
                password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
                logging.info("✅ Found password field")
            except:
                raise Exception("Password field not found")
            
            password_field.clear()
            password_field.send_keys(self.password)
            logging.info("✅ Password entered")
            time.sleep(1)
            
            # Take screenshot before CAPTCHA
            driver.save_screenshot(os.path.join(self.download_dir, "02_before_captcha.png"))
            
            # Solve reCAPTCHA
            if not self.solve_recaptcha_v2(driver):
                raise Exception("CAPTCHA solving failed")
            
            time.sleep(2)
            
            # Take screenshot after CAPTCHA
            driver.save_screenshot(os.path.join(self.download_dir, "03_after_captcha.png"))
            
            # Find and click login button "Entrar"
            login_button = None
            
            # Try multiple strategies
            try:
                # Strategy 1: Button with text "Entrar"
                buttons = driver.find_elements(By.TAG_NAME, "button")
                for btn in buttons:
                    if "entrar" in btn.text.lower():
                        login_button = btn
                        logging.info("✅ Found 'Entrar' button by text")
                        break
            except:
                pass
            
            # Strategy 2: Button with type="submit"
            if not login_button:
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
                    logging.info("✅ Found login button by type='submit'")
                except:
                    pass
            
            # Strategy 3: Any visible button (last resort)
            if not login_button:
                try:
                    buttons = driver.find_elements(By.TAG_NAME, "button")
                    for btn in buttons:
                        if btn.is_displayed():
                            login_button = btn
                            logging.info("✅ Found login button as visible button")
                            break
                except:
                    pass
            
            if not login_button:
                raise Exception("Login button not found")
            
            login_button.click()
            logging.info("✅ Login button clicked")
            
            # Wait for successful login
            time.sleep(5)
            
            # Take screenshot after login
            driver.save_screenshot(os.path.join(self.download_dir, "04_after_login.png"))
            
            # Check if we're logged in (URL should change or dashboard elements appear)
            current_url = driver.current_url
            logging.info(f"Current URL after login: {current_url}")
            
            # Look for dashboard elements
            try:
                # Wait for "Vendas" link to appear
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.PARTIAL_LINK_TEXT, "Venda"))
                )
                logging.info("✅ Login successful! Dashboard loaded")
                return True
            except TimeoutException:
                # Check if we're still on login page
                if "login" in current_url.lower():
                    logging.error("❌ Still on login page - login may have failed")
                    raise Exception("Login failed - still on login page")
                else:
                    logging.info("✅ Login appears successful (URL changed)")
                    return True
                
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_login.png"))
            
            # Save page source for debugging
            with open(os.path.join(self.download_dir, "error_page_source.html"), "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            
            raise
    
    def export_sales(self, driver):
        """Export yesterday's sales data"""
        logging.info("Exporting sales data...")
        
        try:
            # Click on "Vendas" in sidebar
            vendas_link = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "Venda"))
            )
            vendas_link.click()
            time.sleep(3)
            
            driver.save_screenshot(os.path.join(self.download_dir, "05_vendas_page.png"))
            logging.info("✅ Navigated to Sales page")
            
            # Click on period dropdown
            try:
                period_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Ontem') or contains(text(), 'Período')]")
                period_button.click()
                time.sleep(1)
                
                # Select "Ontem" (Yesterday)
                yesterday_option = driver.find_element(By.XPATH, "//button[text()='Ontem'] | //div[text()='Ontem']")
                yesterday_option.click()
                logging.info("✅ Selected 'Ontem' (Yesterday)")
                time.sleep(1)
                
                # Click "Aplicar" button
                try:
                    apply_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Aplicar')]")
                    apply_button.click()
                    time.sleep(2)
                except:
                    logging.info("No apply button needed")
            except:
                logging.info("Period already set to yesterday or no date selector found")
            
            # Click "Buscar" button if exists
            try:
                buscar_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Buscar')]")
                buscar_button.click()
                time.sleep(3)
                logging.info("✅ Clicked 'Buscar'")
            except:
                logging.info("No search button found")
            
            driver.save_screenshot(os.path.join(self.download_dir, "06_before_export.png"))
            
            # Click "Exportar" button
            export_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Exportar')]"))
            )
            export_button.click()
            logging.info("✅ Clicked 'Exportar' button")
            
            # Wait for download
            sales_file = self.wait_for_download("venda", timeout=30)
            
            if sales_file:
                logging.info(f"✅ Sales file downloaded: {sales_file}")
                return sales_file
            else:
                raise Exception("Sales file download timeout")
                
        except Exception as e:
            logging.error(f"❌ Sales export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_sales.png"))
            raise
    
    def export_customers(self, driver):
        """Export customer data"""
        logging.info("Exporting customer data...")
        
        try:
            # Click on "Clientes" in sidebar
            clientes_link = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "Cliente"))
            )
            clientes_link.click()
            time.sleep(3)
            
            driver.save_screenshot(os.path.join(self.download_dir, "07_clientes_page.png"))
            logging.info("✅ Navigated to Customers page")
            
            # Click "Exportar" button
            export_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Exportar')]"))
            )
            export_button.click()
            logging.info("✅ Clicked 'Exportar' button")
            
            # Wait for download
            customer_file = self.wait_for_download("cliente", timeout=30)
            
            if customer_file:
                logging.info(f"✅ Customer file downloaded: {customer_file}")
                return customer_file
            else:
                raise Exception("Customer file download timeout")
                
        except Exception as e:
            logging.error(f"❌ Customer export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_customer.png"))
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
                basename = os.path.basename(file).lower()
                if filename_contains.lower() in basename:
                    # Check if file is complete
                    if not file.endswith('.crdownload') and not file.endswith('.tmp'):
                        file_size = os.path.getsize(file)
                        if file_size > 0:
                            logging.info(f"Found file: {basename} ({file_size} bytes)")
                            return file
            
            time.sleep(1)
        
        # If timeout, return the most recent CSV file
        files = glob.glob(os.path.join(self.download_dir, "*.csv"))
        if files:
            most_recent = max(files, key=os.path.getctime)
            logging.warning(f"Timeout - returning most recent file: {os.path.basename(most_recent)}")
            return most_recent
        
        logging.error("No CSV files found in download directory")
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        """Upload or update file in Google Drive"""
        logging.info(f"Uploading {file_type} to Google Drive...")
        
        try:
            # Parse credentials from JSON string
            creds_dict = json.loads(self.google_creds_json)
            creds = Credentials.from_authorized_user_info(creds_dict)
            
            # Build Drive API service
            service = build('drive', 'v3', credentials=creds)
            
            # Create filename with date
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            new_filename = f"{file_type}_{yesterday}.csv"
            
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
            
            logging.info(f"✅ File uploaded: {updated_file.get('name')}")
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
                self.upload_to_google_drive(sales_file, self.sales_file_id, "sales")
            
            if customer_file:
                self.upload_to_google_drive(customer_file, self.customer_file_id, "customers")
            
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
