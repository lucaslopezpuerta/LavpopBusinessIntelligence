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
        
        # Extract base URL
        self.base_url = self.pos_url.split('/login')[0] if '/login' in self.pos_url else self.pos_url.rsplit('/', 1)[0]
        
        # Build expected URLs
        self.sales_url = f"{self.base_url}/system/sale"
        self.customer_url = f"{self.base_url}/system/customer"
        
        logging.info(f"Base URL: {self.base_url}")
        logging.info(f"Sales URL: {self.sales_url}")
        logging.info(f"Customer URL: {self.customer_url}")
        
        # Google Drive settings
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        
        self.driver = None
        
    def setup_driver(self):
        """Configure Chrome for GitHub Actions"""
        chrome_options = Options()
        
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
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
    
    def is_logged_in(self, driver):
        """Check if already logged in"""
        try:
            current_url = driver.current_url
            logging.info(f"Checking login status. Current URL: {current_url}")
            
            if 'login' in current_url.lower():
                logging.info("On login page - not logged in")
                return False
            
            # Check for dashboard elements
            time.sleep(2)
            body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
            
            if any(word in body_text for word in ['dashboard', 'venda', 'cliente', 'cupom', 'fatura']):
                logging.info("✅ Already logged in")
                return True
            
            return False
            
        except Exception as e:
            logging.warning(f"Could not determine login status: {e}")
            return False
    
    def solve_recaptcha_v2(self, driver):
        """Solve reCAPTCHA v2 using 2Captcha"""
        logging.info("Detecting reCAPTCHA...")
        
        try:
            time.sleep(2)
            
            # Find site key
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            site_key = None
            
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src and "k=" in src:
                    site_key = src.split("k=")[1].split("&")[0]
                    break
            
            if not site_key:
                try:
                    recaptcha_div = driver.find_element(By.CLASS_NAME, "g-recaptcha")
                    site_key = recaptcha_div.get_attribute("data-sitekey")
                except:
                    pass
            
            if not site_key:
                logging.warning("No reCAPTCHA found")
                return False
            
            logging.info(f"Found reCAPTCHA site key: {site_key}")
            logging.info("Sending to 2Captcha...")
            
            result = self.solver.recaptcha(sitekey=site_key, url=driver.current_url)
            captcha_response = result['code']
            logging.info("✅ CAPTCHA solved!")
            
            # Inject solution
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
            logging.info("✅ Solution injected")
            return True
            
        except Exception as e:
            logging.error(f"❌ CAPTCHA solving failed: {e}")
            return False
    
    def login(self, driver):
        """Login to Lavapop POS"""
        logging.info("Starting login process...")
        
        try:
            driver.get(self.pos_url)
            logging.info(f"Navigated to: {self.pos_url}")
            time.sleep(3)
            
            driver.save_screenshot(os.path.join(self.download_dir, "01_initial_page.png"))
            
            # Check if already logged in
            if self.is_logged_in(driver):
                logging.info("✅ Already logged in, skipping login")
                return True
            
            # Find email field - try multiple selectors
            email_field = None
            selectors = [
                'input[type="email"]',
                'input[type="text"]',
                'input[name="email"]',
                'input[name="username"]',
                'input[placeholder*="mail"]',
                'input[placeholder*="usuário"]'
            ]
            
            for selector in selectors:
                try:
                    fields = driver.find_elements(By.CSS_SELECTOR, selector)
                    for field in fields:
                        if field.is_displayed():
                            email_field = field
                            logging.info(f"Found email field: {selector}")
                            break
                    if email_field:
                        break
                except:
                    continue
            
            if not email_field:
                if self.is_logged_in(driver):
                    logging.info("✅ Already logged in (retry check)")
                    return True
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
            
            driver.save_screenshot(os.path.join(self.download_dir, "02_credentials_entered.png"))
            
            # Solve CAPTCHA
            self.solve_recaptcha_v2(driver)
            time.sleep(2)
            
            driver.save_screenshot(os.path.join(self.download_dir, "03_before_submit.png"))
            
            # Find login button
            login_button = None
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "entrar" in btn.text.lower() or "login" in btn.text.lower():
                    login_button = btn
                    break
            
            if not login_button:
                login_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            
            login_button.click()
            logging.info("✅ Login button clicked")
            
            time.sleep(5)
            driver.save_screenshot(os.path.join(self.download_dir, "04_after_login.png"))
            
            if self.is_logged_in(driver):
                logging.info("✅ Login successful!")
                return True
            else:
                raise Exception("Login verification failed")
                
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_login.png"))
            with open(os.path.join(self.download_dir, "page_source.html"), "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            raise
    
    def navigate_to_page(self, driver, direct_url, sidebar_text, page_name):
        """
        Robust navigation: Try direct URL first, fallback to sidebar
        
        Args:
            direct_url: Direct URL to navigate to (e.g., /system/sale)
            sidebar_text: Text to find in sidebar (e.g., "Venda")
            page_name: Human-readable name for logging (e.g., "Sales")
        """
        logging.info(f"="*60)
        logging.info(f"Navigating to {page_name} page")
        logging.info(f"="*60)
        
        # METHOD 1: Direct URL navigation
        logging.info(f"Method 1: Trying direct URL: {direct_url}")
        try:
            driver.get(direct_url)
            time.sleep(3)
            
            current_url = driver.current_url
            logging.info(f"Current URL: {current_url}")
            
            # Verify we're on the right page
            if sidebar_text.lower() in driver.page_source.lower():
                logging.info(f"✅ Direct navigation successful to {page_name}")
                return True
            else:
                logging.warning(f"Direct URL loaded but page content unexpected")
                
        except Exception as e:
            logging.warning(f"Direct navigation failed: {e}")
        
        # METHOD 2: Sidebar navigation
        logging.info(f"Method 2: Trying sidebar navigation for '{sidebar_text}'")
        try:
            # First, make sure we're on a page with sidebar
            if 'login' in driver.current_url.lower():
                logging.warning("Still on login page, cannot use sidebar")
                return False
            
            # Try to find and click sidebar link
            clicked = False
            
            # Try 1: Partial link text
            try:
                link = driver.find_element(By.PARTIAL_LINK_TEXT, sidebar_text)
                if link.is_displayed():
                    link.click()
                    clicked = True
                    logging.info(f"✅ Clicked sidebar link: {sidebar_text}")
            except:
                pass
            
            # Try 2: Search all clickable elements
            if not clicked:
                elements = driver.find_elements(By.CSS_SELECTOR, "a, button, div[onclick]")
                for elem in elements:
                    try:
                        if sidebar_text.lower() in elem.text.lower() and elem.is_displayed():
                            elem.click()
                            clicked = True
                            logging.info(f"✅ Clicked sidebar element: {elem.text}")
                            break
                    except:
                        continue
            
            if clicked:
                time.sleep(3)
                logging.info(f"✅ Sidebar navigation successful to {page_name}")
                return True
            else:
                logging.warning(f"Could not find sidebar element for '{sidebar_text}'")
                
        except Exception as e:
            logging.warning(f"Sidebar navigation failed: {e}")
        
        # METHOD 3: Try common URL patterns as last resort
        logging.info(f"Method 3: Trying URL pattern variations")
        url_variations = [
            f"{self.base_url}/{sidebar_text.lower()}s",  # e.g., /vendas
            f"{self.base_url}/{sidebar_text.lower()}",    # e.g., /venda
            f"{self.base_url}/system/{sidebar_text.lower()}s",
            f"{self.base_url}/system/{sidebar_text.lower()}",
        ]
        
        for url in url_variations:
            try:
                logging.info(f"Trying: {url}")
                driver.get(url)
                time.sleep(2)
                
                if sidebar_text.lower() in driver.page_source.lower():
                    logging.info(f"✅ URL variation successful: {url}")
                    return True
            except:
                continue
        
        logging.error(f"❌ All navigation methods failed for {page_name}")
        return False
    
    def find_and_click(self, driver, text_contains, screenshot_name=None):
        """Find and click an element by text"""
        logging.info(f"Looking for: '{text_contains}'")
        
        try:
            # Try multiple XPath strategies
            xpaths = [
                f"//*[text()='{text_contains}']",
                f"//*[contains(text(), '{text_contains}')]",
                f"//button[contains(text(), '{text_contains}')]",
                f"//a[contains(text(), '{text_contains}')]",
                f"//div[contains(text(), '{text_contains}')]",
            ]
            
            for xpath in xpaths:
                try:
                    elements = driver.find_elements(By.XPATH, xpath)
                    for elem in elements:
                        if elem.is_displayed() and elem.is_enabled():
                            if screenshot_name:
                                driver.save_screenshot(os.path.join(self.download_dir, screenshot_name))
                            elem.click()
                            logging.info(f"✅ Clicked: '{text_contains}'")
                            return True
                except:
                    continue
            
            # Fallback: scan all elements
            all_elements = driver.find_elements(By.CSS_SELECTOR, "a, button, div, span")
            for elem in all_elements:
                try:
                    if text_contains.lower() in elem.text.lower() and elem.is_displayed():
                        if screenshot_name:
                            driver.save_screenshot(os.path.join(self.download_dir, screenshot_name))
                        elem.click()
                        logging.info(f"✅ Clicked: '{text_contains}' (scan method)")
                        return True
                except:
                    continue
            
            logging.warning(f"Could not find: '{text_contains}'")
            return False
            
        except Exception as e:
            logging.error(f"Error clicking '{text_contains}': {e}")
            return False
    
    def export_sales(self, driver):
        """Export yesterday's sales data"""
        try:
            # Navigate to sales page (tries both methods)
            if not self.navigate_to_page(driver, self.sales_url, "Venda", "Sales"):
                raise Exception("Could not navigate to Sales page")
            
            driver.save_screenshot(os.path.join(self.download_dir, "05_sales_page.png"))
            
            # Click period dropdown
            logging.info("Step 1: Clicking period dropdown...")
            if self.find_and_click(driver, "Ontem", "06_period_clicked.png"):
                time.sleep(2)
                
                # Select "Ontem" from modal
                logging.info("Step 2: Selecting 'Ontem' from date picker...")
                ontem_buttons = driver.find_elements(By.XPATH, "//*[text()='Ontem']")
                if len(ontem_buttons) > 1:
                    try:
                        ontem_buttons[1].click()
                        logging.info("✅ Selected 'Ontem'")
                    except:
                        logging.info("'Ontem' may already be selected")
                time.sleep(1)
                
                driver.save_screenshot(os.path.join(self.download_dir, "07_ontem_selected.png"))
                
                # Click "Aplicar"
                logging.info("Step 3: Clicking 'Aplicar'...")
                if self.find_and_click(driver, "Aplicar", "08_aplicar_clicked.png"):
                    time.sleep(2)
            
            # Click "Buscar"
            logging.info("Step 4: Clicking 'Buscar'...")
            if self.find_and_click(driver, "Buscar", "09_buscar_clicked.png"):
                time.sleep(4)
            
            # Click "Exportar"
            logging.info("Step 5: Clicking 'Exportar'...")
            driver.save_screenshot(os.path.join(self.download_dir, "10_before_export.png"))
            
            if not self.find_and_click(driver, "Exportar", "11_export_clicked.png"):
                raise Exception("Could not click 'Exportar' button")
            
            # Wait for download
            logging.info("Waiting for download...")
            sales_file = self.wait_for_download(timeout=30)
            
            if sales_file:
                logging.info(f"✅ Sales file: {os.path.basename(sales_file)}")
                return sales_file
            else:
                raise Exception("Sales download timeout")
                
        except Exception as e:
            logging.error(f"❌ Sales export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_sales.png"))
            raise
    
    def export_customers(self, driver):
        """Export customer data"""
        try:
            # Navigate to customer page (tries both methods)
            if not self.navigate_to_page(driver, self.customer_url, "Cliente", "Customer"):
                raise Exception("Could not navigate to Customer page")
            
            driver.save_screenshot(os.path.join(self.download_dir, "12_customer_page.png"))
            
            # Click "Exportar"
            logging.info("Clicking 'Exportar'...")
            driver.save_screenshot(os.path.join(self.download_dir, "13_before_export.png"))
            
            if not self.find_and_click(driver, "Exportar", "14_export_clicked.png"):
                raise Exception("Could not click 'Exportar' button")
            
            # Wait for download
            logging.info("Waiting for download...")
            customer_file = self.wait_for_download(timeout=30)
            
            if customer_file:
                logging.info(f"✅ Customer file: {os.path.basename(customer_file)}")
                return customer_file
            else:
                raise Exception("Customer download timeout")
                
        except Exception as e:
            logging.error(f"❌ Customer export failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_customer.png"))
            raise
    
    def wait_for_download(self, timeout=30):
        """Wait for new CSV file"""
        logging.info("Waiting for CSV download...")
        
        initial_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        logging.info(f"Initial CSV count: {len(initial_files)}")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            current_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new_files = current_files - initial_files
            
            for file in new_files:
                if file.endswith('.crdownload') or file.endswith('.tmp'):
                    continue
                
                try:
                    if os.path.getsize(file) > 0:
                        logging.info(f"New file: {os.path.basename(file)} ({os.path.getsize(file)} bytes)")
                        time.sleep(1)
                        return file
                except:
                    continue
            
            time.sleep(1)
        
        # Timeout fallback
        current_files = glob.glob(os.path.join(self.download_dir, "*.csv"))
        logging.error(f"Download timeout. Total CSVs: {len(current_files)}")
        
        if current_files:
            most_recent = max(current_files, key=os.path.getctime)
            if most_recent not in initial_files:
                logging.warning(f"Returning most recent: {os.path.basename(most_recent)}")
                return most_recent
        
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        """Upload to Google Drive"""
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
            logging.error(f"❌ Upload failed: {e}")
            raise
    
    def run(self):
        """Main execution"""
        try:
            logging.info("="*60)
            logging.info("LAVAPOP POS AUTOMATION - ROBUST VERSION")
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
