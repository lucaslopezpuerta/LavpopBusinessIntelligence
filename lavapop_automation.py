"""
Lavapop POS Automation - v1.1
Changes:
- Screenshots saved to root directory for GitHub Actions artifacts
- Explicit submit button clicks (no Enter key fallback)
- reCAPTCHA callback handling fixed
- Multiple redirect detection strategies
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
import json
import time
from datetime import datetime, timedelta
import os
import logging
import glob

VERSION = "1.1"

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
        
        logging.info(f"Version: {VERSION}")
        logging.info(f"Base URL: {self.base_url}")
        
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
    
    def solve_recaptcha_v2(self, driver):
        """Solve reCAPTCHA v2 with callback execution"""
        logging.info("🔍 Detecting reCAPTCHA...")
        
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
                logging.warning("⚠️ No reCAPTCHA found")
                return False
            
            logging.info(f"✅ Site key: {site_key}")
            logging.info("⏳ Solving with 2Captcha...")
            
            # Solve CAPTCHA
            result = self.solver.recaptcha(sitekey=site_key, url=driver.current_url)
            captcha_response = result['code']
            logging.info(f"✅ CAPTCHA solved!")
            
            # Inject solution AND trigger callback
            success = driver.execute_script(
                f'''
                try {{
                    // Set response in all places
                    document.getElementById("g-recaptcha-response").innerHTML = "{captcha_response}";
                    
                    var textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                    if (textarea) {{
                        textarea.innerHTML = "{captcha_response}";
                        textarea.value = "{captcha_response}";
                        textarea.style.display = "block";
                    }}
                    
                    // CRITICAL: Execute callback function
                    var recaptchaElement = document.querySelector('.g-recaptcha');
                    if (recaptchaElement) {{
                        var callback = recaptchaElement.getAttribute('data-callback');
                        if (callback && typeof window[callback] === 'function') {{
                            console.log('Executing callback: ' + callback);
                            window[callback]("{captcha_response}");
                            return 'callback_executed';
                        }}
                    }}
                    
                    // Trigger change events
                    if (textarea) {{
                        var event = new Event('change', {{ bubbles: true }});
                        textarea.dispatchEvent(event);
                    }}
                    
                    return 'token_set';
                }} catch(e) {{
                    return 'error: ' + e.message;
                }}
                '''
            )
            
            logging.info(f"📝 Result: {success}")
            time.sleep(2)
            
            return True
            
        except Exception as e:
            logging.error(f"❌ CAPTCHA failed: {e}")
            return False
    
    def login(self, driver):
        """Login with explicit button clicking"""
        try:
            logging.info(f"🌐 Opening: {self.pos_url}")
            driver.get(self.pos_url)
            time.sleep(3)
            
            # Check if already logged in
            if self.is_logged_in(driver):
                logging.info("✅ Already logged in!")
                return True
            
            driver.save_screenshot("01_login_page.png")
            
            # Fill credentials
            logging.info("📝 Filling credentials...")
            username_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            username_field.clear()
            username_field.send_keys(self.username)
            
            password_field = driver.find_element(By.NAME, "password")
            password_field.clear()
            password_field.send_keys(self.password)
            
            driver.save_screenshot("02_credentials_filled.png")
            
            # Solve CAPTCHA
            if not self.solve_recaptcha_v2(driver):
                raise Exception("CAPTCHA solving failed")
            
            driver.save_screenshot("03_captcha_solved.png")
            
            # EXPLICIT BUTTON CLICK - NO Enter key usage
            logging.info("🔘 Finding submit button...")
            submit_button = None
            
            submit_selectors = [
                (By.CSS_SELECTOR, "button[type='submit']"),
                (By.CSS_SELECTOR, "input[type='submit']"),
                (By.XPATH, "//button[contains(text(), 'Entrar')]"),
                (By.XPATH, "//button[contains(text(), 'Login')]"),
                (By.XPATH, "//input[@value='Entrar']"),
                (By.CSS_SELECTOR, ".btn-primary"),
                (By.CSS_SELECTOR, "button.btn"),
                (By.TAG_NAME, "button")
            ]
            
            for selector_type, selector_value in submit_selectors:
                try:
                    buttons = driver.find_elements(selector_type, selector_value)
                    for btn in buttons:
                        if btn.is_displayed() and btn.is_enabled():
                            submit_button = btn
                            logging.info(f"✅ Found: {btn.get_attribute('outerHTML')[:100]}")
                            break
                    if submit_button:
                        break
                except:
                    continue
            
            if not submit_button:
                raise Exception("Submit button not found - check screenshot 03_captcha_solved.png")
            
            # Click submit button explicitly
            logging.info("📤 Clicking submit button...")
            try:
                submit_button.click()
            except:
                # If regular click fails, try JavaScript click
                driver.execute_script("arguments[0].click();", submit_button)
            
            logging.info("✅ Button clicked")
            driver.save_screenshot("04_button_clicked.png")
            
            # Wait for redirect with multiple strategies
            logging.info("⏳ Waiting for redirect...")
            redirect_successful = False
            
            # Strategy 1: Wait for URL change
            try:
                WebDriverWait(driver, 30).until(
                    lambda d: d.current_url != self.pos_url and 'login' not in d.current_url.lower()
                )
                logging.info(f"✅ URL changed to: {driver.current_url}")
                redirect_successful = True
            except TimeoutException:
                logging.warning("⚠️ URL didn't change in 30s")
            
            # Strategy 2: Check for dashboard content
            time.sleep(3)
            if not redirect_successful:
                if self.is_logged_in(driver):
                    logging.info("✅ Dashboard detected")
                    redirect_successful = True
            
            driver.save_screenshot("05_after_login.png")
            
            if not redirect_successful:
                error = self.check_for_errors(driver)
                if error:
                    raise Exception(f"Login error: {error}")
                raise Exception("Redirect timeout - check screenshots")
            
            # Final verification
            time.sleep(2)
            if not self.is_logged_in(driver):
                raise Exception("Login verification failed")
            
            logging.info("✅ Login successful!")
            return True
            
        except Exception as e:
            logging.error(f"❌ Login failed: {e}")
            driver.save_screenshot("error_login.png")
            raise
    
    def is_logged_in(self, driver):
        """Check login status"""
        try:
            current_url = driver.current_url
            
            # Check 1: Dashboard URL
            if '/system' in current_url and 'login' not in current_url.lower():
                return True
            
            # Check 2: Dashboard content
            body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
            dashboard_keywords = ['venda', 'cliente', 'dashboard', 'cupom', 'loja']
            found = [kw for kw in dashboard_keywords if kw in body_text]
            
            if len(found) >= 2:
                return True
            
            # Check 3: No login form
            try:
                driver.find_element(By.NAME, "username")
                return False
            except NoSuchElementException:
                if found:
                    return True
            
            return False
            
        except Exception as e:
            logging.warning(f"⚠️ Login check error: {e}")
            return False
    
    def check_for_errors(self, driver):
        """Check for error messages"""
        try:
            error_selectors = [
                '.error', '.alert-danger', '.alert-error',
                '[class*="error"]', '[role="alert"]',
                '.invalid-feedback', '.text-danger'
            ]
            
            for selector in error_selectors:
                try:
                    errors = driver.find_elements(By.CSS_SELECTOR, selector)
                    for error in errors:
                        if error.is_displayed() and error.text.strip():
                            return error.text.strip()
                except:
                    continue
            return None
        except:
            return None
    
    def navigate_to_page(self, driver, url, sidebar_text, page_name):
        """Navigate to page"""
        logging.info(f"📍 {page_name}...")
        
        try:
            driver.get(url)
            time.sleep(3)
            if sidebar_text.lower() in driver.page_source.lower():
                logging.info(f"✅ {page_name} loaded")
                return True
        except Exception as e:
            logging.warning(f"Direct navigation failed: {e}")
        
        try:
            links = driver.find_elements(By.TAG_NAME, "a")
            for link in links:
                if sidebar_text in link.text:
                    link.click()
                    time.sleep(3)
                    return True
        except Exception as e:
            logging.warning(f"Sidebar failed: {e}")
        
        return False
    
    def find_and_click(self, driver, text_contains, screenshot_name=None):
        """Find and click element"""
        try:
            elements = driver.find_elements(By.XPATH, f"//*[contains(text(), '{text_contains}')]")
            for elem in elements:
                try:
                    if elem.is_displayed() and elem.is_enabled():
                        if screenshot_name:
                            driver.save_screenshot(screenshot_name)
                        elem.click()
                        logging.info(f"✅ Clicked: '{text_contains}'")
                        return True
                except:
                    continue
            return False
        except Exception as e:
            logging.error(f"❌ Click error '{text_contains}': {e}")
            return False
    
    def export_sales(self, driver):
        """Export sales"""
        try:
            if not self.navigate_to_page(driver, self.sales_url, "Venda", "Sales"):
                raise Exception("Could not navigate to Sales")
            
            driver.save_screenshot("10_sales_page.png")
            
            if self.find_and_click(driver, "Ontem", "11_period.png"):
                time.sleep(2)
                ontem_buttons = driver.find_elements(By.XPATH, "//*[text()='Ontem']")
                if len(ontem_buttons) > 1:
                    ontem_buttons[1].click()
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
            raise Exception("Sales timeout")
            
        except Exception as e:
            logging.error(f"❌ Sales failed: {e}")
            driver.save_screenshot("error_sales.png")
            raise
    
    def export_customers(self, driver):
        """Export customers"""
        try:
            if not self.navigate_to_page(driver, self.customer_url, "Cliente", "Customer"):
                raise Exception("Could not navigate to Customers")
            
            driver.save_screenshot("20_customer_page.png")
            
            if not self.find_and_click(driver, "Exportar", "21_exportar.png"):
                raise Exception("Export button not found")
            
            customer_file = self.wait_for_download(timeout=30)
            if customer_file:
                logging.info(f"✅ Customers: {os.path.basename(customer_file)}")
                return customer_file
            raise Exception("Customer timeout")
            
        except Exception as e:
            logging.error(f"❌ Customer failed: {e}")
            driver.save_screenshot("error_customer.png")
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
        logging.info(f"☁️ Uploading {file_type}...")
        
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
            
            logging.info(f"✅ {updated_file.get('name')}")
            return updated_file
            
        except Exception as e:
            logging.error(f"❌ Upload failed: {e}")
            raise
    
    def run(self):
        """Main execution"""
        try:
            logging.info("="*60)
            logging.info(f"🚀 LAVAPOP POS AUTOMATION v{VERSION}")
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
