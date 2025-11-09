"""
Lavapop POS Automation - v1.4
Complete workflow with proper CAPTCHA validation waiting
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

VERSION = "1.4"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
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
        
        self.google_creds_json = os.getenv('GOOGLE_CREDENTIALS')
        self.sales_file_id = os.getenv('SALES_FILE_ID')
        self.customer_file_id = os.getenv('CUSTOMER_FILE_ID')
        self.driver = None
        
        logging.info(f"=== LAVAPOP POS AUTOMATION v{VERSION} ===")
        
    def setup_driver(self):
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        prefs = {
            "download.default_directory": self.download_dir,
            "download.prompt_for_download": False,
            "safebrowsing.enabled": False
        }
        chrome_options.add_experimental_option("prefs", prefs)
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        params = {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}}
        driver.execute("send_command", params)
        
        return driver
    
    def is_logged_in(self):
        """Check if already logged in"""
        try:
            url = self.driver.current_url
            if '/system' in url and 'login' not in url.lower():
                logging.info("✓ Already logged in (URL check)")
                return True
            
            body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            if any(kw in body for kw in ['venda', 'cliente', 'dashboard']):
                logging.info("✓ Already logged in (content check)")
                return True
                
            return False
        except:
            return False
    
    def login(self):
        """Step 1-5: Login with CAPTCHA"""
        logging.info("\n[STEP 1] Opening login page...")
        self.driver.get(self.pos_url)
        time.sleep(3)
        self.driver.save_screenshot("01_opened.png")
        
        # Check if already logged in
        if self.is_logged_in():
            logging.info("✓ Session still active, skipping login")
            return True
        
        logging.info("[STEP 2] Filling credentials...")
        
        # Find email field
        email_field = None
        for selector in [(By.NAME, "email"), (By.ID, "email"), (By.CSS_SELECTOR, "input[type='email']")]:
            try:
                email_field = WebDriverWait(self.driver, 2).until(EC.presence_of_element_located(selector))
                break
            except:
                continue
        
        if not email_field:
            raise Exception("Email field not found")
        
        # Find password field
        pass_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_field.clear()
        email_field.send_keys(self.username)
        pass_field.clear()
        pass_field.send_keys(self.password)
        
        self.driver.save_screenshot("02_credentials.png")
        logging.info("✓ Credentials filled")
        
        logging.info("[STEP 3] Solving CAPTCHA with 2Captcha...")
        
        # Find sitekey
        site_key = None
        for iframe in self.driver.find_elements(By.TAG_NAME, "iframe"):
            src = iframe.get_attribute("src") or ""
            if "recaptcha" in src and "k=" in src:
                site_key = src.split("k=")[1].split("&")[0]
                break
        
        if not site_key:
            site_key = self.driver.find_element(By.CLASS_NAME, "g-recaptcha").get_attribute("data-sitekey")
        
        logging.info(f"  Sitekey: {site_key}")
        
        # Solve with 2Captcha
        result = self.solver.recaptcha(sitekey=site_key, url=self.driver.current_url)
        token = result['code']
        logging.info(f"  Token received: {token[:40]}...")
        
        # Inject token
        self.driver.execute_script(f"""
            document.getElementById("g-recaptcha-response").innerHTML = "{token}";
            var textarea = document.getElementById("g-recaptcha-response");
            textarea.value = "{token}";
        """)
        
        logging.info("[STEP 4] Waiting for green checkmark...")
        
        # Wait for visual confirmation (up to 10 seconds)
        checkmark_appeared = False
        for i in range(20):  # 20 * 0.5s = 10s
            time.sleep(0.5)
            
            # Check if reCAPTCHA iframe shows success state
            success_check = self.driver.execute_script("""
                var iframe = document.querySelector('iframe[src*="recaptcha"][src*="bframe"]');
                if (!iframe) return false;
                
                try {
                    // Check if success class is present
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var checkmark = doc.querySelector('.recaptcha-checkbox-checkmark');
                    if (checkmark) {
                        var style = window.getComputedStyle(checkmark);
                        return style.opacity !== '0' && style.display !== 'none';
                    }
                } catch(e) {
                    // Cross-origin, check textarea value instead
                    var textarea = document.getElementById("g-recaptcha-response");
                    return textarea && textarea.value.length > 0;
                }
                return false;
            """)
            
            if success_check:
                checkmark_appeared = True
                logging.info(f"✓ Green checkmark appeared (after {(i+1)*0.5}s)")
                break
        
        if not checkmark_appeared:
            logging.warning("  Checkmark not visually confirmed, but proceeding (token is set)")
        
        self.driver.save_screenshot("03_captcha_solved.png")
        
        logging.info("[STEP 5] Clicking 'Entrar' button...")
        
        # Find and click submit button
        submit_btn = None
        for selector in ["button[type='submit']", "//button[contains(text(), 'Entrar')]"]:
            try:
                if selector.startswith("//"):
                    buttons = self.driver.find_elements(By.XPATH, selector)
                else:
                    buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                
                for btn in buttons:
                    if btn.is_displayed():
                        submit_btn = btn
                        break
                if submit_btn:
                    break
            except:
                continue
        
        if not submit_btn:
            raise Exception("Submit button not found")
        
        try:
            submit_btn.click()
        except:
            self.driver.execute_script("arguments[0].click();", submit_btn)
        
        logging.info("  Button clicked, waiting for redirect...")
        self.driver.save_screenshot("04_submitted.png")
        
        # Wait for redirect
        try:
            WebDriverWait(self.driver, 30).until(
                lambda d: '/system' in d.current_url or 'dashboard' in d.current_url.lower()
            )
        except TimeoutException:
            pass
        
        time.sleep(3)
        self.driver.save_screenshot("05_after_login.png")
        
        if not self.is_logged_in():
            raise Exception("Login failed - still on login page")
        
        logging.info("✓ Login successful!\n")
        return True
    
    def export_sales(self):
        """Step 6: Export sales data"""
        logging.info("[STEP 6] Exporting sales data...")
        
        logging.info("  Navigating to Vendas...")
        self.driver.get(self.sales_url)
        time.sleep(3)
        self.driver.save_screenshot("06_vendas_page.png")
        
        logging.info("  Clicking 'Ontem' period...")
        # Click period selector
        period_btn = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Ontem')]")
        period_btn.click()
        time.sleep(2)
        self.driver.save_screenshot("07_period_menu.png")
        
        # Click "Ontem" option in dropdown
        ontem_options = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
        if len(ontem_options) > 1:
            ontem_options[1].click()
        time.sleep(1)
        
        # Click "Aplicar"
        aplicar = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Aplicar')]")
        aplicar.click()
        time.sleep(2)
        self.driver.save_screenshot("08_period_applied.png")
        
        logging.info("  Clicking 'Buscar'...")
        buscar = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Buscar')]")
        buscar.click()
        time.sleep(4)
        self.driver.save_screenshot("09_search_done.png")
        
        logging.info("  Clicking 'Exportar'...")
        exportar = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]")
        exportar.click()
        
        # Wait for download
        sales_file = self.wait_for_download()
        if not sales_file:
            raise Exception("Sales download timeout")
        
        self.driver.save_screenshot("10_sales_exported.png")
        logging.info(f"✓ Sales exported: {os.path.basename(sales_file)}")
        
        # Upload to Google Drive
        self.upload_to_drive(sales_file, self.sales_file_id, "sales")
        logging.info("✓ Sales uploaded to Google Drive\n")
        
        return sales_file
    
    def export_customers(self):
        """Step 7: Export customer data"""
        logging.info("[STEP 7] Exporting customer data...")
        
        logging.info("  Navigating to Clientes...")
        self.driver.get(self.customer_url)
        time.sleep(3)
        self.driver.save_screenshot("11_clientes_page.png")
        
        logging.info("  Clicking 'Exportar'...")
        exportar = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]")
        exportar.click()
        
        # Wait for download
        customer_file = self.wait_for_download()
        if not customer_file:
            raise Exception("Customer download timeout")
        
        self.driver.save_screenshot("12_customers_exported.png")
        logging.info(f"✓ Customers exported: {os.path.basename(customer_file)}")
        
        # Upload to Google Drive
        self.upload_to_drive(customer_file, self.customer_file_id, "customers")
        logging.info("✓ Customers uploaded to Google Drive\n")
        
        return customer_file
    
    def logout(self):
        """Step 8: Log out"""
        logging.info("[STEP 8] Logging out...")
        try:
            # Look for logout button/link
            logout_selectors = [
                "//a[contains(text(), 'Sair')]",
                "//button[contains(text(), 'Sair')]",
                "//a[contains(@href, 'logout')]",
                "//*[contains(@class, 'logout')]"
            ]
            
            for selector in logout_selectors:
                try:
                    logout_elem = self.driver.find_element(By.XPATH, selector)
                    if logout_elem.is_displayed():
                        logout_elem.click()
                        time.sleep(2)
                        logging.info("✓ Logged out")
                        return
                except:
                    continue
            
            logging.warning("  Logout button not found, session will expire naturally")
        except Exception as e:
            logging.warning(f"  Logout failed: {e}")
    
    def wait_for_download(self, timeout=30):
        """Wait for CSV file download"""
        initial = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start = time.time()
        
        while time.time() - start < timeout:
            current = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new = current - initial
            
            for f in new:
                if not f.endswith(('.crdownload', '.tmp')):
                    if os.path.getsize(f) > 0:
                        time.sleep(1)
                        return f
            time.sleep(1)
        
        return None
    
    def upload_to_drive(self, file_path, file_id, file_type):
        """Upload file to Google Drive"""
        creds = Credentials.from_authorized_user_info(json.loads(self.google_creds_json))
        service = build('drive', 'v3', credentials=creds)
        
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        filename = f"{file_type}_{yesterday}.csv"
        
        media = MediaFileUpload(file_path, mimetype='text/csv', resumable=True)
        service.files().update(
            fileId=file_id,
            body={'name': filename},
            media_body=media
        ).execute()
    
    def run(self):
        """Execute complete workflow"""
        try:
            self.driver = self.setup_driver()
            
            self.login()
            self.export_sales()
            self.export_customers()
            self.logout()
            
            logging.info("="*60)
            logging.info("✓✓✓ AUTOMATION COMPLETED SUCCESSFULLY ✓✓✓")
            logging.info("="*60)
            return True
            
        except Exception as e:
            logging.error(f"\n✗✗✗ AUTOMATION FAILED ✗✗✗")
            logging.error(f"Error: {e}", exc_info=True)
            self.driver.save_screenshot("error_final.png")
            return False
            
        finally:
            if self.driver:
                self.driver.quit()

def main():
    success = LavapopAutomation().run()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
