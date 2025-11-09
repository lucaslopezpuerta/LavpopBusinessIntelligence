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

# Logging setup
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
        # Save screenshots to root directory so they're uploaded to artifacts
        self.work_dir = os.getcwd()
        
        # Environment variables
        self.captcha_api_key = os.getenv('CAPTCHA_API_KEY')
        self.solver = TwoCaptcha(self.captcha_api_key)
        
        self.pos_url = os.getenv('POS_URL')
        self.username = os.getenv('POS_USERNAME')
        self.password = os.getenv('POS_PASSWORD')
        
        # Build URLs
        self.base_url = self.pos_url.split('/login')[0] if '/login' in self.pos_url else self.pos_url.rsplit('/', 1)[0]
        self.sales_url = f"{self.base_url}/system/sale"
        self.customer_url = f"{self.base_url}/system/customer"
        
        logging.info(f"Base URL: {self.base_url}")
        logging.info(f"Sales URL: {self.sales_url}")
        logging.info(f"Customer URL: {self.customer_url}")
        
        # Google Drive
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
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        # Download settings
        prefs = {
            "download.default_directory": self.work_dir,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": False
        }
        chrome_options.add_experimental_option("prefs", prefs)
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=chrome_options)
        
        # Enable downloads in headless mode
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.work_dir}}
        driver.execute("send_command", params)
        
        return driver
    
    def screenshot(self, name):
        """Save screenshot to root directory"""
        try:
            self.driver.save_screenshot(os.path.join(self.work_dir, f"{name}.png"))
            logging.info(f"Screenshot: {name}.png")
        except Exception as e:
            logging.warning(f"Screenshot failed: {e}")
    
    def is_logged_in(self):
        """Check if already logged in"""
        try:
            current_url = self.driver.current_url
            
            # Primary check: Dashboard URL
            if current_url.startswith(f"{self.base_url}/system"):
                logging.info(f"✅ Logged in: {current_url}")
                return True
            
            # Secondary check: Not on login page
            if 'login' in current_url.lower():
                return False
            
            # Tertiary check: Dashboard content
            time.sleep(1)
            body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            dashboard_keywords = ['dashboard', 'venda', 'cliente', 'cupom', 'fatura']
            if any(kw in body_text for kw in dashboard_keywords):
                return True
            
            return False
            
        except Exception as e:
            logging.warning(f"Login check error: {e}")
            return False
    
    def has_captcha_error(self):
        """Check if form shows CAPTCHA error"""
        try:
            body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            if "preencha o captcha" in body_text:
                logging.warning("CAPTCHA error detected on page")
                return True
            return False
        except:
            return False
    
    def check_for_page_errors(self):
        """Check for any error messages on page"""
        try:
            error_selectors = [
                '.error', '.alert-danger', '.alert-error',
                '[class*="error"]', '[role="alert"]'
            ]
            
            for selector in error_selectors:
                try:
                    errors = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for error in errors:
                        if error.is_displayed() and error.text.strip():
                            logging.error(f"Page error: {error.text}")
                            return error.text
                except:
                    continue
            
            return None
        except Exception as e:
            logging.warning(f"Error check failed: {e}")
            return None
    
    def solve_captcha_with_retry(self):
        """Solve CAPTCHA and verify form accepts it (with retry)"""
        logging.info("="*60)
        logging.info("SOLVING CAPTCHA")
        logging.info("="*60)
        
        try:
            time.sleep(2)
            
            # Find site key
            iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
            site_key = None
            
            for iframe in iframes:
                src = iframe.get_attribute("src") or ""
                if "recaptcha" in src and "k=" in src:
                    site_key = src.split("k=")[1].split("&")[0]
                    logging.info(f"Found reCAPTCHA iframe")
                    break
            
            # Alternative: Look for div with data-sitekey
            if not site_key:
                try:
                    recaptcha_div = self.driver.find_element(By.CLASS_NAME, "g-recaptcha")
                    site_key = recaptcha_div.get_attribute("data-sitekey")
                    logging.info(f"Found reCAPTCHA div")
                except:
                    pass
            
            if not site_key:
                raise Exception("Site key not found")
            
            logging.info(f"Site key: {site_key}")
            logging.info("Sending to 2Captcha (30-60 seconds)...")
            
            # Solve with 2Captcha
            result = self.solver.recaptcha(sitekey=site_key, url=self.driver.current_url)
            token = result['code']
            logging.info(f"✅ Token received ({len(token)} characters)")
            
            # Try injection up to 3 times
            max_attempts = 3
            for attempt in range(max_attempts):
                logging.info(f"Injection attempt {attempt + 1}/{max_attempts}")
                
                # Inject token into all possible places
                self.driver.execute_script(f'''
                    var token = "{token}";
                    
                    // Inject into response element
                    var responseElement = document.getElementById("g-recaptcha-response");
                    if (responseElement) {{
                        responseElement.innerHTML = token;
                    }}
                    
                    // Inject into textarea
                    var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                    if (textarea) {{
                        textarea.value = token;
                        textarea.innerHTML = token;
                        textarea.style.display = "block";
                    }}
                ''')
                
                # Trigger ALL possible callbacks
                self.driver.execute_script(f'''
                    var token = "{token}";
                    
                    // Method 1: Direct callback execution
                    if (typeof ___grecaptcha_cfg !== 'undefined') {{
                        Object.keys(___grecaptcha_cfg.clients).forEach(function(clientId) {{
                            var client = ___grecaptcha_cfg.clients[clientId];
                            Object.keys(client).forEach(function(widgetId) {{
                                var widget = client[widgetId];
                                if (widget && widget.callback) {{
                                    try {{
                                        widget.callback(token);
                                        console.log('Callback executed for widget ' + widgetId);
                                    }} catch(e) {{
                                        console.error('Callback error:', e);
                                    }}
                                }}
                            }});
                        }});
                    }}
                    
                    // Method 2: Trigger change event
                    var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                    if (textarea) {{
                        var changeEvent = new Event('change', {{ bubbles: true }});
                        textarea.dispatchEvent(changeEvent);
                    }}
                    
                    // Method 3: Data-callback attribute
                    var recaptchaDiv = document.querySelector('.g-recaptcha');
                    if (recaptchaDiv) {{
                        var callbackName = recaptchaDiv.getAttribute('data-callback');
                        if (callbackName && typeof window[callbackName] === 'function') {{
                            try {{
                                window[callbackName](token);
                                console.log('Data-callback executed');
                            }} catch(e) {{
                                console.error('Data-callback error:', e);
                            }}
                        }}
                    }}
                ''')
                
                logging.info("Token injected, waiting 5 seconds for form validation...")
                time.sleep(5)
                
                # Check if form accepts CAPTCHA
                if not self.has_captcha_error():
                    logging.info(f"✅ Form accepts CAPTCHA (attempt {attempt + 1})")
                    self.screenshot("captcha_accepted")
                    return True
                else:
                    logging.warning(f"Form still shows CAPTCHA error (attempt {attempt + 1})")
                    if attempt < max_attempts - 1:
                        logging.info("Retrying injection...")
                        time.sleep(2)
            
            # All attempts failed
            logging.error("❌ Form won't accept CAPTCHA after 3 attempts")
            return False
            
        except Exception as e:
            logging.error(f"❌ CAPTCHA solving failed: {e}")
            return False
    
    def submit_form_multiple_methods(self, password_field):
        """Try multiple methods to submit the form"""
        logging.info("Attempting form submission...")
        
        # Method 1: Enter key on password field
        try:
            password_field.send_keys(Keys.RETURN)
            logging.info("✅ Submitted with Enter key")
            return True
        except Exception as e:
            logging.warning(f"Enter key failed: {e}")
        
        # Method 2: Find and click submit button by text
        try:
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "entrar" in btn.text.lower() or "login" in btn.text.lower():
                    btn.click()
                    logging.info(f"✅ Clicked button: '{btn.text}'")
                    return True
        except Exception as e:
            logging.warning(f"Button text search failed: {e}")
        
        # Method 3: Find submit button by type
        try:
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            submit_btn.click()
            logging.info("✅ Clicked submit button")
            return True
        except Exception as e:
            logging.warning(f"Submit button failed: {e}")
        
        # Method 4: JavaScript click
        try:
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for btn in buttons:
                if "entrar" in btn.text.lower():
                    self.driver.execute_script("arguments[0].click();", btn)
                    logging.info("✅ JavaScript click")
                    return True
        except Exception as e:
            logging.warning(f"JS click failed: {e}")
        
        # Method 5: Form.submit()
        try:
            self.driver.execute_script("document.querySelector('form').submit();")
            logging.info("✅ Form.submit()")
            return True
        except Exception as e:
            logging.warning(f"Form.submit failed: {e}")
        
        logging.error("❌ All submission methods failed")
        return False
    
    def login(self):
        """Login to Lavapop POS"""
        logging.info("="*60)
        logging.info("LOGIN PROCESS")
        logging.info("="*60)
        
        try:
            # Navigate to login page
            self.driver.get(self.pos_url)
            logging.info(f"Navigated to: {self.pos_url}")
            time.sleep(3)
            self.screenshot("01_login_page")
            
            # Check if already logged in
            if self.is_logged_in():
                logging.info("✅ Already logged in, skipping login")
                return True
            
            # Find email field (try multiple selectors)
            email_field = None
            email_selectors = [
                'input[name="email"]',
                'input[type="email"]',
                'input[type="text"]',
                'input[name="username"]',
                'input[placeholder*="mail"]',
                'input[placeholder*="usuário"]'
            ]
            
            for selector in email_selectors:
                try:
                    fields = self.driver.find_elements(By.CSS_SELECTOR, selector)
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
                raise Exception("Email field not found")
            
            # Enter username
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
            
            self.screenshot("02_credentials_entered")
            
            # Solve CAPTCHA with retry
            if not self.solve_captcha_with_retry():
                raise Exception("CAPTCHA solving/acceptance failed")
            
            # Extra wait to ensure callbacks processed
            time.sleep(3)
            self.screenshot("03_before_submit")
            
            # Check for any errors before submitting
            error = self.check_for_page_errors()
            if error and "captcha" in error.lower():
                raise Exception(f"Pre-submit error: {error}")
            
            # Submit form using multiple methods
            if not self.submit_form_multiple_methods(password_field):
                raise Exception("Form submission failed")
            
            # Wait a moment for submission to process
            time.sleep(2)
            self.screenshot("04_after_submit")
            
            # Wait for redirect to /system
            logging.info("Waiting for redirect to /system...")
            dashboard_url = f"{self.base_url}/system"
            
            for i in range(30):
                time.sleep(1)
                current_url = self.driver.current_url
                
                # Check if redirected
                if current_url.startswith(dashboard_url):
                    logging.info(f"✅ Redirect successful! Now at: {current_url}")
                    self.screenshot("05_dashboard")
                    break
                
                # Periodic logging and screenshots
                if i in [4, 9, 14, 19, 24, 29]:
                    logging.info(f"Still waiting... ({i+1}s) Current: {current_url}")
                    self.screenshot(f"wait_{i+1}s")
                
                # Check if error appeared
                if i % 5 == 0:
                    error = self.check_for_page_errors()
                    if error:
                        logging.error(f"Error detected: {error}")
            
            # Final verification
            time.sleep(2)
            self.screenshot("06_final_state")
            
            if self.is_logged_in():
                logging.info("="*60)
                logging.info("✅ LOGIN SUCCESSFUL")
                logging.info(f"Dashboard URL: {self.driver.current_url}")
                logging.info("="*60)
                return True
            else:
                current_url = self.driver.current_url
                expected_url = f"{self.base_url}/system"
                raise Exception(f"Login failed: Expected {expected_url}, still at {current_url}")
                
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            self.screenshot("error_login")
            
            # Save page source for debugging
            try:
                with open(os.path.join(self.work_dir, "page_source.html"), "w", encoding="utf-8") as f:
                    f.write(self.driver.page_source)
            except:
                pass
            
            raise
    
    def navigate_to_page(self, direct_url, sidebar_text, page_name):
        """
        Triple-redundant navigation:
        1. Direct URL
        2. Sidebar click
        3. URL variations
        """
        logging.info(f"Navigating to {page_name}...")
        
        # METHOD 1: Direct URL
        try:
            self.driver.get(direct_url)
            time.sleep(3)
            if sidebar_text.lower() in self.driver.page_source.lower():
                logging.info(f"✅ Direct URL successful")
                return True
        except Exception as e:
            logging.warning(f"Direct URL failed: {e}")
        
        # METHOD 2: Sidebar navigation
        try:
            link = self.driver.find_element(By.PARTIAL_LINK_TEXT, sidebar_text)
            if link.is_displayed():
                link.click()
                time.sleep(3)
                logging.info(f"✅ Sidebar navigation successful")
                return True
        except Exception as e:
            logging.warning(f"Sidebar failed: {e}")
        
        # METHOD 3: URL variations
        variations = [
            f"{self.base_url}/{sidebar_text.lower()}s",
            f"{self.base_url}/{sidebar_text.lower()}",
        ]
        
        for url in variations:
            try:
                self.driver.get(url)
                time.sleep(2)
                if sidebar_text.lower() in self.driver.page_source.lower():
                    logging.info(f"✅ URL variation successful: {url}")
                    return True
            except:
                continue
        
        logging.error(f"❌ All navigation methods failed for {page_name}")
        return False
    
    def find_and_click(self, text):
        """Find and click element by text"""
        try:
            # Try exact text match first
            elements = self.driver.find_elements(By.XPATH, f"//*[text()='{text}']")
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    elem.click()
                    logging.info(f"✅ Clicked: '{text}'")
                    return True
            
            # Try contains
            elements = self.driver.find_elements(By.XPATH, f"//*[contains(text(), '{text}')]")
            for elem in elements:
                if elem.is_displayed() and elem.is_enabled():
                    elem.click()
                    logging.info(f"✅ Clicked: '{text}' (contains)")
                    return True
            
            logging.warning(f"Element not found: '{text}'")
            return False
            
        except Exception as e:
            logging.error(f"Click failed for '{text}': {e}")
            return False
    
    def export_sales(self):
        """Export yesterday's sales"""
        logging.info("="*60)
        logging.info("EXPORTING SALES")
        logging.info("="*60)
        
        try:
            # Navigate to sales page
            if not self.navigate_to_page(self.sales_url, "Venda", "Sales"):
                raise Exception("Navigation to Sales page failed")
            
            self.screenshot("10_sales_page")
            
            # Date selection workflow
            if self.find_and_click("Ontem"):
                time.sleep(2)
                # Select "Ontem" from dropdown (second occurrence)
                ontem_buttons = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
                if len(ontem_buttons) > 1:
                    try:
                        ontem_buttons[1].click()
                        logging.info("Selected 'Ontem' from date picker")
                    except:
                        pass
                
                time.sleep(1)
                self.find_and_click("Aplicar")
                time.sleep(2)
            
            # Search
            self.find_and_click("Buscar")
            time.sleep(4)
            
            self.screenshot("11_before_export")
            
            # Export
            if not self.find_and_click("Exportar"):
                raise Exception("Export button not found")
            
            # Wait for download
            sales_file = self.wait_for_download(timeout=30)
            
            if sales_file:
                logging.info(f"✅ Sales file: {os.path.basename(sales_file)}")
                return sales_file
            else:
                raise Exception("Sales download timeout")
                
        except Exception as e:
            logging.error(f"❌ Sales export failed: {e}")
            self.screenshot("error_sales")
            raise
    
    def export_customers(self):
        """Export customer data"""
        logging.info("="*60)
        logging.info("EXPORTING CUSTOMERS")
        logging.info("="*60)
        
        try:
            # Navigate to customers page
            if not self.navigate_to_page(self.customer_url, "Cliente", "Customers"):
                raise Exception("Navigation to Customers page failed")
            
            self.screenshot("20_customers_page")
            
            # Export
            if not self.find_and_click("Exportar"):
                raise Exception("Export button not found")
            
            # Wait for download
            customer_file = self.wait_for_download(timeout=30)
            
            if customer_file:
                logging.info(f"✅ Customer file: {os.path.basename(customer_file)}")
                return customer_file
            else:
                raise Exception("Customer download timeout")
                
        except Exception as e:
            logging.error(f"❌ Customer export failed: {e}")
            self.screenshot("error_customers")
            raise
    
    def wait_for_download(self, timeout=30):
        """Wait for CSV file to be downloaded"""
        logging.info("Waiting for download...")
        
        initial_files = set(glob.glob(os.path.join(self.work_dir, "*.csv")))
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            current_files = set(glob.glob(os.path.join(self.work_dir, "*.csv")))
            new_files = current_files - initial_files
            
            for file in new_files:
                # Skip incomplete downloads
                if file.endswith('.crdownload') or file.endswith('.tmp'):
                    continue
                
                # Check if file has content
                try:
                    if os.path.getsize(file) > 0:
                        time.sleep(1)  # Give it a moment to finish writing
                        return file
                except:
                    continue
            
            time.sleep(1)
        
        logging.error(f"Download timeout ({timeout}s)")
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        """Upload file to Google Drive"""
        logging.info(f"Uploading {file_type} to Google Drive...")
        
        try:
            # Parse credentials
            creds_dict = json.loads(self.google_creds_json)
            creds = Credentials.from_authorized_user_info(creds_dict)
            
            # Build Drive API
            service = build('drive', 'v3', credentials=creds)
            
            # Create filename with date
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            filename = f"{file_type}_{yesterday}.csv"
            
            # Upload
            media = MediaFileUpload(file_path, mimetype='text/csv', resumable=True)
            file_metadata = {'name': filename}
            
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
            logging.info("LAVAPOP POS AUTOMATION - FULL ROBUST VERSION")
            logging.info("="*60)
            
            # Setup
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
            
            logging.info("="*60)
            logging.info("✅ AUTOMATION COMPLETED SUCCESSFULLY")
            logging.info("="*60)
            
            return True
            
        except Exception as e:
            logging.error(f"❌ AUTOMATION FAILED: {e}")
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
