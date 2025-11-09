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
            
            # Primary check: Dashboard URL after successful login
            if current_url.startswith(f"{self.base_url}/system"):
                logging.info(f"✅ Logged in - on dashboard URL: {current_url}")
                return True
            
            # Secondary check: If on login page
            if 'login' in current_url.lower():
                logging.info("On login page - not logged in")
                return False
            
            # Tertiary check: Dashboard elements in page
            time.sleep(1)
            body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
            
            dashboard_keywords = ['dashboard', 'venda', 'cliente', 'cupom', 'fatura', 'loja', 'configurações']
            found_keywords = [kw for kw in dashboard_keywords if kw in body_text]
            
            if found_keywords:
                logging.info(f"✅ Dashboard elements found: {', '.join(found_keywords)}")
                return True
            
            logging.info("Not logged in")
            return False
            
        except Exception as e:
            logging.warning(f"Could not determine login status: {e}")
            return False
    
    def check_for_errors(self, driver):
        """Check if there are any error messages on the page"""
        try:
            # Common error selectors
            error_selectors = [
                '.error', '.alert-danger', '.alert-error',
                '[class*="error"]', '[class*="alert"]',
                '[role="alert"]'
            ]
            
            for selector in error_selectors:
                try:
                    errors = driver.find_elements(By.CSS_SELECTOR, selector)
                    for error in errors:
                        if error.is_displayed() and error.text.strip():
                            logging.error(f"Page error found: {error.text}")
                            return error.text
                except:
                    continue
            
            return None
        except Exception as e:
            logging.warning(f"Error check failed: {e}")
            return None
    
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
            logging.info("Sending to 2Captcha (this may take 30-60 seconds)...")
            
            result = self.solver.recaptcha(sitekey=site_key, url=driver.current_url)
            captcha_response = result['code']
            logging.info(f"✅ CAPTCHA solved! Token length: {len(captcha_response)}")
            
            # Inject solution into multiple places
            driver.execute_script(
                f'''
                // Set the response value
                document.getElementById("g-recaptcha-response").innerHTML="{captcha_response}";
                
                // Set textarea value
                var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                if (textarea) {{
                    textarea.innerHTML = "{captcha_response}";
                    textarea.value = "{captcha_response}";
                    textarea.style.display = "block";
                }}
                
                // Make the response visible (some forms check for this)
                var responseDiv = document.getElementById("g-recaptcha-response");
                if (responseDiv) {{
                    responseDiv.style.display = "block";
                }}
                '''
            )
            
            # Trigger all possible callbacks
            driver.execute_script(
                f'''
                // Trigger grecaptcha callback
                if (typeof ___grecaptcha_cfg !== 'undefined') {{
                    var clients = ___grecaptcha_cfg.clients;
                    for (var client in clients) {{
                        var widgets = clients[client];
                        for (var widget in widgets) {{
                            if (widgets[widget] && widgets[widget].callback) {{
                                try {{
                                    widgets[widget].callback("{captcha_response}");
                                }} catch(e) {{
                                    console.log("Callback error:", e);
                                }}
                            }}
                        }}
                    }}
                }}
                
                // Try to find and trigger any reCAPTCHA callback function
                if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.getResponse !== 'undefined') {{
                    console.log("grecaptcha available");
                }}
                '''
            )
            
            time.sleep(2)
            logging.info("✅ CAPTCHA solution injected and callbacks triggered")
            return True
            
        except Exception as e:
            logging.error(f"❌ CAPTCHA solving failed: {e}")
            return False
    
    def login(self, driver):
        """Login to Lavapop POS"""
        logging.info("="*60)
        logging.info("STARTING LOGIN PROCESS")
        logging.info("="*60)
        
        try:
            driver.get(self.pos_url)
            logging.info(f"Navigated to: {self.pos_url}")
            time.sleep(3)
            
            driver.save_screenshot(os.path.join(self.download_dir, "01_initial_page.png"))
            
            # Check if already logged in
            if self.is_logged_in(driver):
                logging.info("✅ Already logged in, skipping login")
                return True
            
            # Find email field
            email_field = None
            selectors = [
                'input[name="email"]',
                'input[type="email"]',
                'input[type="text"]',
                'input[name="username"]',
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
            if not self.solve_recaptcha_v2(driver):
                logging.warning("CAPTCHA solving had issues, but continuing...")
            
            time.sleep(3)
            driver.save_screenshot(os.path.join(self.download_dir, "03_before_submit.png"))
            
            # Check for errors before submitting
            error = self.check_for_errors(driver)
            if error:
                raise Exception(f"Error on page before login: {error}")
            
            # Method 1: Try submitting with Enter key (most reliable for CAPTCHA forms)
            logging.info("Attempting form submission with Enter key...")
            try:
                password_field.send_keys(Keys.RETURN)
                logging.info("✅ Submitted form with Enter key")
                submitted = True
            except Exception as e:
                logging.warning(f"Enter key submission failed: {e}")
                submitted = False
            
            # Method 2: Find and click login button (fallback)
            if not submitted:
                login_button = None
                
                methods = [
                    ('text search', lambda: [btn for btn in driver.find_elements(By.TAG_NAME, "button") if "entrar" in btn.text.lower() or "login" in btn.text.lower()]),
                    ('submit button', lambda: driver.find_elements(By.CSS_SELECTOR, 'button[type="submit"]')),
                    ('submit input', lambda: driver.find_elements(By.CSS_SELECTOR, 'input[type="submit"]')),
                ]
                
                for method_name, method in methods:
                    try:
                        buttons = method()
                        if buttons:
                            login_button = buttons[0]
                            logging.info(f"Found login button using: {method_name}")
                            break
                    except:
                        continue
                
                if not login_button:
                    raise Exception("Login button not found and Enter key submission failed")
                
                # Click the button
                try:
                    login_button.click()
                    logging.info("✅ Login button clicked")
                except:
                    # Try JavaScript click as fallback
                    driver.execute_script("arguments[0].click();", login_button)
                    logging.info("✅ Login button clicked (JavaScript)")
            
            # Wait longer for page to process and redirect
            logging.info("Waiting for login to process...")
            time.sleep(3)
            
            driver.save_screenshot(os.path.join(self.download_dir, "04_after_click.png"))
            
            # Check for errors after clicking
            error = self.check_for_errors(driver)
            if error:
                logging.error(f"Login error detected: {error}")
            
            # Wait for URL change to dashboard (up to 15 seconds)
            initial_url = driver.current_url
            dashboard_url = f"{self.base_url}/system"
            logging.info(f"Waiting for redirect from {initial_url} to {dashboard_url}")
            
            redirect_detected = False
            for attempt in range(15):
                time.sleep(1)
                current_url = driver.current_url
                
                # Check if we reached the dashboard URL
                if current_url.startswith(dashboard_url):
                    logging.info(f"✅ Redirect successful! Now at: {current_url}")
                    driver.save_screenshot(os.path.join(self.download_dir, f"05_redirect_success_{attempt}.png"))
                    redirect_detected = True
                    break
                
                # Check if URL changed at all
                if current_url != initial_url:
                    logging.info(f"URL changed to: {current_url} (not dashboard yet)")
                    driver.save_screenshot(os.path.join(self.download_dir, f"05_url_changed_{attempt}.png"))
                
                # Check if dashboard appeared without URL change (edge case)
                if self.is_logged_in(driver):
                    logging.info(f"Dashboard detected via content check")
                    driver.save_screenshot(os.path.join(self.download_dir, f"05_dashboard_{attempt}.png"))
                    redirect_detected = True
                    break
                
                if attempt % 3 == 0 and attempt > 0:
                    logging.info(f"Still waiting for redirect... ({attempt + 1}/15 seconds)")
            
            if not redirect_detected:
                logging.warning(f"No redirect detected after 15 seconds. Current URL: {driver.current_url}")
            
            # Final verification
            time.sleep(2)
            driver.save_screenshot(os.path.join(self.download_dir, "06_final_state.png"))
            
            if self.is_logged_in(driver):
                final_url = driver.current_url
                logging.info("="*60)
                logging.info("✅ LOGIN SUCCESSFUL!")
                logging.info(f"Dashboard URL: {final_url}")
                logging.info("="*60)
                return True
            else:
                # Login failed - provide detailed debugging info
                current_url = driver.current_url
                page_title = driver.title
                expected_url = f"{self.base_url}/system"
                
                logging.error("="*60)
                logging.error("❌ LOGIN VERIFICATION FAILED")
                logging.error(f"Expected URL: {expected_url}")
                logging.error(f"Current URL:  {current_url}")
                logging.error(f"Page title:   {page_title}")
                logging.error("="*60)
                
                # Check for errors on page
                error = self.check_for_errors(driver)
                if error:
                    raise Exception(f"Login failed with error: {error}")
                else:
                    raise Exception(f"Login failed: Expected redirect to {expected_url}, but stayed at {current_url}")
                
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_login.png"))
            
            # Save full page source for debugging
            with open(os.path.join(self.download_dir, "page_source.html"), "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            
            raise
    
    def navigate_to_page(self, driver, direct_url, sidebar_text, page_name):
        """Robust navigation with triple fallback"""
        logging.info(f"="*60)
        logging.info(f"Navigating to {page_name} page")
        logging.info(f"="*60)
        
        # METHOD 1: Direct URL
        logging.info(f"Method 1: Direct URL: {direct_url}")
        try:
            driver.get(direct_url)
            time.sleep(3)
            
            if sidebar_text.lower() in driver.page_source.lower():
                logging.info(f"✅ Direct navigation successful")
                return True
        except Exception as e:
            logging.warning(f"Direct navigation failed: {e}")
        
        # METHOD 2: Sidebar
        logging.info(f"Method 2: Sidebar navigation")
        try:
            link = driver.find_element(By.PARTIAL_LINK_TEXT, sidebar_text)
            if link.is_displayed():
                link.click()
                time.sleep(3)
                logging.info(f"✅ Sidebar navigation successful")
                return True
        except Exception as e:
            logging.warning(f"Sidebar navigation failed: {e}")
        
        # METHOD 3: URL variations
        logging.info(f"Method 3: URL variations")
        variations = [
            f"{self.base_url}/{sidebar_text.lower()}s",
            f"{self.base_url}/{sidebar_text.lower()}",
        ]
        
        for url in variations:
            try:
                driver.get(url)
                time.sleep(2)
                if sidebar_text.lower() in driver.page_source.lower():
                    logging.info(f"✅ URL variation successful: {url}")
                    return True
            except:
                continue
        
        logging.error(f"❌ All navigation methods failed")
        return False
    
    def find_and_click(self, driver, text_contains, screenshot_name=None):
        """Find and click element"""
        logging.info(f"Looking for: '{text_contains}'")
        
        try:
            elements = driver.find_elements(By.XPATH, f"//*[contains(text(), '{text_contains}')]")
            for elem in elements:
                try:
                    if elem.is_displayed() and elem.is_enabled():
                        if screenshot_name:
                            driver.save_screenshot(os.path.join(self.download_dir, screenshot_name))
                        elem.click()
                        logging.info(f"✅ Clicked: '{text_contains}'")
                        return True
                except:
                    continue
            
            logging.warning(f"Could not find: '{text_contains}'")
            return False
            
        except Exception as e:
            logging.error(f"Error clicking '{text_contains}': {e}")
            return False
    
    def export_sales(self, driver):
        """Export sales"""
        try:
            if not self.navigate_to_page(driver, self.sales_url, "Venda", "Sales"):
                raise Exception("Could not navigate to Sales")
            
            driver.save_screenshot(os.path.join(self.download_dir, "10_sales_page.png"))
            
            # Period selection workflow
            if self.find_and_click(driver, "Ontem", "11_period.png"):
                time.sleep(2)
                ontem_buttons = driver.find_elements(By.XPATH, "//*[text()='Ontem']")
                if len(ontem_buttons) > 1:
                    try:
                        ontem_buttons[1].click()
                    except:
                        pass
                self.find_and_click(driver, "Aplicar", "12_aplicar.png")
                time.sleep(2)
            
            self.find_and_click(driver, "Buscar", "13_buscar.png")
            time.sleep(4)
            
            if not self.find_and_click(driver, "Exportar", "14_exportar.png"):
                raise Exception("Export button not found")
            
            sales_file = self.wait_for_download(timeout=30)
            if sales_file:
                logging.info(f"✅ Sales: {os.path.basename(sales_file)}")
                return sales_file
            raise Exception("Sales download timeout")
            
        except Exception as e:
            logging.error(f"❌ Sales failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_sales.png"))
            raise
    
    def export_customers(self, driver):
        """Export customers"""
        try:
            if not self.navigate_to_page(driver, self.customer_url, "Cliente", "Customer"):
                raise Exception("Could not navigate to Customers")
            
            driver.save_screenshot(os.path.join(self.download_dir, "20_customer_page.png"))
            
            if not self.find_and_click(driver, "Exportar", "21_exportar.png"):
                raise Exception("Export button not found")
            
            customer_file = self.wait_for_download(timeout=30)
            if customer_file:
                logging.info(f"✅ Customer: {os.path.basename(customer_file)}")
                return customer_file
            raise Exception("Customer download timeout")
            
        except Exception as e:
            logging.error(f"❌ Customer failed: {e}")
            driver.save_screenshot(os.path.join(self.download_dir, "error_customer.png"))
            raise
    
    def wait_for_download(self, timeout=30):
        """Wait for CSV download"""
        initial_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            current_files = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new_files = current_files - initial_files
            
            for file in new_files:
                if not file.endswith('.crdownload') and not file.endswith('.tmp'):
                    try:
                        if os.path.getsize(file) > 0:
                            time.sleep(1)
                            return file
                    except:
                        continue
            time.sleep(1)
        
        return None
    
    def upload_to_google_drive(self, file_path, file_id, file_type):
        """Upload to Google Drive"""
        logging.info(f"Uploading {file_type}...")
        
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
            logging.info(f"📎 {updated_file.get('webViewLink')}")
            
            return updated_file
            
        except Exception as e:
            logging.error(f"❌ Upload failed: {e}")
            raise
    
    def run(self):
        """Main execution"""
        try:
            logging.info("="*60)
            logging.info("LAVAPOP POS AUTOMATION")
            logging.info("="*60)
            
            self.driver = self.setup_driver()
            self.login(self.driver)
            
            sales_file = self.export_sales(self.driver)
            customer_file = self.export_customers(self.driver)
            
            if sales_file:
                self.upload_to_google_drive(sales_file, self.sales_file_id, "sales")
            if customer_file:
                self.upload_to_google_drive(customer_file, self.customer_file_id, "customers")
            
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
    automation = LavapopAutomation()
    success = automation.run()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
