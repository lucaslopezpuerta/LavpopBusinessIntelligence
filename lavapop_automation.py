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
            time.sleep(2)
            
            # Find reCAPTCHA iframe and extract site key
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
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
                    recaptcha_div = driver.find_element(By.CLASS_NAME, "g-recaptcha")
                    site_key = recaptcha_div.get_attribute("data-sitekey")
                except:
                    pass
            
            if not site_key:
                logging.error("Could not find reCAPTCHA site key")
                return False
            
            logging.info(f"Found reCAPTCHA site key: {site_key}")
            logging.info("Sending CAPTCHA to 2Captcha for solving...")
            
            # Solve with 2Captcha
            result = self.solver.recaptcha(
                sitekey=site_key,
                url=driver.current_url
            )
            
            captcha_response = result['code']
            logging.info(f"✅ CAPTCHA solved! Token length: {len(captcha_response)}")
            
            # Inject the solution
            driver.execute_script(
                f'''
                document.getElementById("g-recaptcha-response").innerHTML="{captcha_response}";
                var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                if (textarea) {{
                    textarea.innerHTML = "{captcha_response}";
                    textarea.value = "{captcha_response}";
                }}
                '''
            )
            
            # Trigger callback
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
            
            driver.save_screenshot(os.path.join(self.download_dir, "01_login_page.png"))
            
            # Find email field
            email_field = None
            for selector in ['input[type="email"]', 'input[type="text"]']:
                try:
                    email_field = driver.find_element(By.CSS_SELECTOR, selector)
                    if email_field.is_displayed():
                        break
                except:
                    continue
            
            if not email_field:
                raise Exception("Email field not found")
            
            email_field.clear()
            email_field.send_keys(self.username)
            logging.info("✅ Username entered")
            time.sleep(1)
            
            # Find password field
            password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
            password_field.clear()
            password_field.send_keys(self.password)
            logging.info("✅ Password entered")
            time.sleep(1)
            
            driver.save_screenshot(os.path.join(self.download_dir, "02_before_captcha.png"))
            
            # Solve reCAPTCHA
            if not self.solve_recaptcha_v2(driver):
                raise Exception("CAPTCHA solving failed")
            
            time.sleep(2)
            driver.save_screenshot(os.path.join(self.download_dir, "03_after_captcha.png"))
            
            # Find and click login button
            login_button = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "entrar" in btn.text.lower():
                    login_button = btn
                    break
            
            if not login_button:
                login_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            
            login_button.click()
            logging.info("✅ Login button clicked")
            
            # Wait longer for dashboard to load
            time.sleep(8)
            
            driver.save_screenshot(os.path.join(self.download_dir, "04_after_login.png"))
            
            current_url = driver.current_url
            logging.info(f"Current URL after login: {current_url}")
            
            # Check if login was successful by looking for dashboard elements
            try:
                # Look for any sidebar menu item
                sidebar_items = driver.find_elements(By.CSS_SELECTOR, "a, button, div")
                found_dashboard = False
                
                for item in sidebar_items:
                    text = item.text.lower()
                    if any(word in text for word in ["venda", "cliente", "dashboard", "cupom"]):
                        found_dashboard = True
                        logging.info(f"✅ Found dashboard element: {item.text}")
                        break
                
                if found_dashboard:
                    logging.info("✅ Login successful! Dashboard loaded")
                    return True
                else:
                    logging.warning("Dashboard elements not found, but proceeding...")
                    return True
                    
            except Exception as e:
                logging.warning(f"Could not verify dashboard: {e}")
                return True
                
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_login.png"))
            raise
    
    def find_clickable_element(self, driver, text_contains, timeout=10):
        """Find a clickable element by text content"""
        logging.info(f"Looking for element containing: '{text_contains}'")
        
        try:
            # First try: direct text match
            elements = driver.find_elements(By.XPATH, f"//*[contains(text(), '{text_contains}')]")
            for elem in elements:
                if elem.is_displayed():
                    logging.info(f"Found element by text: {elem.tag_name}")
                    return elem
            
            # Second try: case-insensitive
            elements = driver.find_elements(By.XPATH, f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{text_contains.lower()}')]")
            for elem in elements:
                if elem.is_displayed():
                    logging.info(f"Found element by case-insensitive text: {elem.tag_name}")
                    return elem
            
            # Third try: search all elements
            all_elements = driver.find_elements(By.CSS_SELECTOR, "a, button, div, span")
            for elem in all_elements:
                try:
                    if text_contains.lower() in elem.text.lower() and elem.is_displayed():
                        logging.info(f"Found element by scanning: {elem.tag_name} - {elem.text}")
                        return elem
                except:
                    continue
            
            logging.error(f"Element not found: '{text_contains}'")
            return None
            
        except Exception as e:
            logging.error(f"Error finding element: {e}")
            return None
    
    def export_sales(self, driver):
        """Export yesterday's sales data"""
        logging.info("="*60)
        logging.info("Starting sales export...")
        logging.info("="*60)
        
        try:
            # Step 1: Navigate to Vendas page
            logging.info("Step 1: Looking for 'Vendas' link...")
            driver.save_screenshot(os.path.join(self.download_dir, "05_looking_for_vendas.png"))
            
            # Try multiple ways to find and click Vendas
            vendas_clicked = False
            
            # Method 1: Direct link
            try:
                vendas_link = driver.find_element(By.PARTIAL_LINK_TEXT, "Venda")
                vendas_link.click()
                vendas_clicked = True
                logging.info("✅ Clicked Vendas link (Method 1)")
            except:
                pass
            
            # Method 2: Use our helper function
            if not vendas_clicked:
                vendas_elem = self.find_clickable_element(driver, "Venda")
                if vendas_elem:
                    vendas_elem.click()
                    vendas_clicked = True
                    logging.info("✅ Clicked Vendas link (Method 2)")
            
            # Method 3: Navigate directly to vendas URL
            if not vendas_clicked:
                base_url = self.pos_url.rsplit('/', 1)[0]
                vendas_url = f"{base_url}/vendas"
                logging.info(f"Navigating directly to: {vendas_url}")
                driver.get(vendas_url)
                vendas_clicked = True
            
            time.sleep(4)
            driver.save_screenshot(os.path.join(self.download_dir, "06_vendas_page.png"))
            logging.info("✅ On Vendas page")
            
            # Step 2: Click on Period dropdown
            logging.info("Step 2: Looking for period dropdown...")
            period_button = self.find_clickable_element(driver, "Ontem")
            
            if period_button:
                period_button.click()
                time.sleep(2)
                driver.save_screenshot(os.path.join(self.download_dir, "07_period_dropdown.png"))
                logging.info("✅ Clicked period dropdown")
                
                # Step 3: Select "Ontem" from modal
                logging.info("Step 3: Selecting 'Ontem' from date picker...")
                try:
                    # Look for "Ontem" button in the modal
                    ontem_options = driver.find_elements(By.XPATH, "//*[text()='Ontem']")
                    clicked_ontem = False
                    
                    for option in ontem_options:
                        try:
                            if option.is_displayed() and option.is_enabled():
                                option.click()
                                clicked_ontem = True
                                logging.info("✅ Selected 'Ontem'")
                                break
                        except:
                            continue
                    
                    if not clicked_ontem:
                        logging.warning("Could not click Ontem, it might already be selected")
                    
                    time.sleep(1)
                    driver.save_screenshot(os.path.join(self.download_dir, "08_ontem_selected.png"))
                    
                    # Step 4: Click "Aplicar" button
                    logging.info("Step 4: Looking for 'Aplicar' button...")
                    aplicar_button = self.find_clickable_element(driver, "Aplicar")
                    
                    if aplicar_button:
                        aplicar_button.click()
                        time.sleep(2)
                        driver.save_screenshot(os.path.join(self.download_dir, "09_after_aplicar.png"))
                        logging.info("✅ Clicked 'Aplicar'")
                    else:
                        logging.warning("'Aplicar' button not found, continuing...")
                        
                except Exception as e:
                    logging.warning(f"Period selection issue: {e}, continuing...")
            else:
                logging.info("Period already set to 'Ontem' or dropdown not needed")
            
            # Step 5: Click "Buscar" button
            logging.info("Step 5: Looking for 'Buscar' button...")
            buscar_button = self.find_clickable_element(driver, "Buscar")
            
            if buscar_button:
                buscar_button.click()
                time.sleep(4)
                driver.save_screenshot(os.path.join(self.download_dir, "10_after_buscar.png"))
                logging.info("✅ Clicked 'Buscar'")
            else:
                logging.info("'Buscar' button not found or not needed")
            
            # Step 6: Click "Exportar" button
            logging.info("Step 6: Looking for 'Exportar' button...")
            driver.save_screenshot(os.path.join(self.download_dir, "11_before_export.png"))
            
            export_button = self.find_clickable_element(driver, "Exportar")
            
            if not export_button:
                raise Exception("'Exportar' button not found")
            
            export_button.click()
            logging.info("✅ Clicked 'Exportar' button")
            
            # Wait for download
            sales_file = self.wait_for_download("venda", timeout=30)
            
            if sales_file:
                logging.info(f"✅ Sales file downloaded: {sales_file}")
                return sales_file
            else:
                # Try looking for any CSV
                sales_file = self.wait_for_download("", timeout=10)
                if sales_file:
                    logging.info(f"✅ CSV file downloaded: {sales_file}")
                    return sales_file
                raise Exception("Sales file download timeout")
                
        except Exception as e:
            logging.error(f"❌ Sales export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_sales.png"))
            raise
    
    def export_customers(self, driver):
        """Export customer data"""
        logging.info("="*60)
        logging.info("Starting customer export...")
        logging.info("="*60)
        
        try:
            # Step 1: Navigate to Clientes page
            logging.info("Step 1: Looking for 'Clientes' link...")
            
            clientes_clicked = False
            
            # Method 1: Direct link
            try:
                clientes_link = driver.find_element(By.PARTIAL_LINK_TEXT, "Cliente")
                clientes_link.click()
                clientes_clicked = True
                logging.info("✅ Clicked Clientes link (Method 1)")
            except:
                pass
            
            # Method 2: Use helper function
            if not clientes_clicked:
                clientes_elem = self.find_clickable_element(driver, "Cliente")
                if clientes_elem:
                    clientes_elem.click()
                    clientes_clicked = True
                    logging.info("✅ Clicked Clientes link (Method 2)")
            
            # Method 3: Direct navigation
            if not clientes_clicked:
                base_url = self.pos_url.rsplit('/', 1)[0]
                clientes_url = f"{base_url}/clientes"
                logging.info(f"Navigating directly to: {clientes_url}")
                driver.get(clientes_url)
            
            time.sleep(4)
            driver.save_screenshot(os.path.join(self.download_dir, "12_clientes_page.png"))
            logging.info("✅ On Clientes page")
            
            # Step 2: Click "Exportar" button
            logging.info("Step 2: Looking for 'Exportar' button...")
            
            export_button = self.find_clickable_element(driver, "Exportar")
            
            if not export_button:
                raise Exception("'Exportar' button not found")
            
            export_button.click()
            logging.info("✅ Clicked 'Exportar' button")
            
            # Wait for download
            customer_file = self.wait_for_download("cliente", timeout=30)
            
            if customer_file:
                logging.info(f"✅ Customer file downloaded: {customer_file}")
                return customer_file
            else:
                # Try looking for any CSV
                customer_file = self.wait_for_download("", timeout=10)
                if customer_file:
                    logging.info(f"✅ CSV file downloaded: {customer_file}")
                    return customer_file
                raise Exception("Customer file download timeout")
                
        except Exception as e:
            logging.error(f"❌ Customer export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_customer.png"))
            raise
    
    def wait_for_download(self, filename_contains, timeout=30):
        """Wait for a file to be downloaded"""
        logging.info(f"Waiting for download (filter: '{filename_contains}')...")
        
        # Get initial files
        initial_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            current_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new_files = current_files - initial_files
            
            for file in new_files:
                # Skip incomplete downloads
                if file.endswith('.crdownload') or file.endswith('.tmp'):
                    continue
                
                # Check if file has content
                if os.path.getsize(file) > 0:
                    basename = os.path.basename(file).lower()
                    
                    # If no filter, return first valid file
                    if not filename_contains:
                        logging.info(f"Found new file: {basename}")
                        return file
                    
                    # Check if filename matches filter
                    if filename_contains.lower() in basename:
                        logging.info(f"Found matching file: {basename}")
                        return file
            
            time.sleep(1)
        
        # Timeout - return most recent file if filter is empty
        if not filename_contains:
            all_files = glob.glob(os.path.join(self.download_dir, "*.csv"))
            if all_files:
                most_recent = max(all_files, key=os.path.getctime)
                logging.warning(f"Timeout - returning most recent: {os.path.basename(most_recent)}")
                return most_recent
        
        logging.error(f"Download timeout (looking for '{filename_contains}')")
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        """Upload or update file in Google Drive"""
        logging.info(f"Uploading {file_type} to Google Drive...")
        
        try:
            # Parse credentials
            creds_dict = json.loads(self.google_creds_json)
            creds = Credentials.from_authorized_user_info(creds_dict)
            
            # Build Drive API
            service = build('drive', 'v3', credentials=creds)
            
            # Create filename with date
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            new_filename = f"{file_type}_{yesterday}.csv"
            
            # Upload
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
            logging.info("="*60)
            logging.info("LAVAPOP POS AUTOMATION")
            logging.info("="*60)
            
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
            logging.info("✅ AUTOMATION COMPLETED SUCCESSFULLY!")
            logging.info("="*60)
            
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
