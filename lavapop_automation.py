"""
Lavapop POS Automation - v2.1
Fix: Wait for elements to load, use WebDriverWait
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from twocaptcha import TwoCaptcha
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import json, time, os, logging, glob
from datetime import datetime, timedelta

VERSION = "2.1"

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
        logging.info(f"LAVAPOP v{VERSION}")
        logging.info("="*70)
        
    def setup_driver(self):
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--window-size=1920,1080')
        
        prefs = {"download.default_directory": self.download_dir, "download.prompt_for_download": False}
        opts.add_experimental_option("prefs", prefs)
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        driver = webdriver.Chrome(options=opts)
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        driver.execute("send_command", {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}})
        
        return driver
    
    def login(self):
        logging.info("Login...")
        
        self.driver.get(self.pos_url)
        
        # Wait for page load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="email"]'))
        )
        time.sleep(2)
        self.driver.save_screenshot("01_page.png")
        
        # Fill
        self.driver.find_element(By.CSS_SELECTOR, 'input[name="email"]').send_keys(self.username)
        self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys(self.password)
        
        logging.info("✓ Credentials")
        self.driver.save_screenshot("02_creds.png")
        
        # Wait for reCAPTCHA iframe
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'iframe[src*="recaptcha"]'))
        )
        
        # Get sitekey from iframe (most reliable method)
        sitekey = None
        for iframe in self.driver.find_elements(By.TAG_NAME, "iframe"):
            src = iframe.get_attribute("src") or ""
            if "recaptcha" in src and "k=" in src:
                sitekey = src.split("k=")[1].split("&")[0]
                break
        
        if not sitekey:
            raise Exception("Sitekey not found")
        
        logging.info(f"Sitekey: {sitekey}")
        
        # Solve
        result = self.solver.recaptcha(sitekey=sitekey, url=self.driver.current_url)
        token = result['code']
        logging.info(f"✓ Token: {token[:40]}...")
        
        # Inject with PDF method (visible textarea + callback)
        result = self.driver.execute_script(f'''
            var token = "{token}";
            
            var textarea = document.getElementById("g-recaptcha-response");
            if (!textarea) return "no_textarea";
            
            textarea.value = token;
            textarea.innerHTML = token;
            textarea.style.display = "block";  // Make visible per PDF
            
            var ran = false;
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var clients = ___grecaptcha_cfg.clients;
                for (var c in clients) {{
                    for (var w in clients[c]) {{
                        if (clients[c][w] && clients[c][w].callback) {{
                            clients[c][w].callback(token);
                            ran = true;
                        }}
                    }}
                }}
            }}
            
            return ran ? "visible+callback" : "visible_only";
        ''')
        
        logging.info(f"✓ Injection: {result}")
        time.sleep(3)
        self.driver.save_screenshot("03_ready.png")
        
        # Submit
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]").click()
        logging.info("✓ Submitted")
        
        time.sleep(5)
        self.driver.save_screenshot("04_after.png")
        
        # Check
        if "preencha o captcha" in self.driver.find_element(By.TAG_NAME, "body").text.lower():
            raise Exception("Form rejected token - server-side validation")
        
        if 'system' in self.driver.current_url:
            logging.info(f"✓ Login: {self.driver.current_url}")
            return True
        else:
            raise Exception(f"Failed: {self.driver.current_url}")
    
    def export_sales(self):
        logging.info("="*70)
        logging.info("Sales...")
        
        self.driver.get(self.sales_url)
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Ontem')]").click()
        time.sleep(2)
        
        opts = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
        if len(opts) > 1:
            opts[1].click()
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Aplicar')]").click()
        time.sleep(2)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Buscar')]").click()
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        f = self.wait_download()
        logging.info(f"✓ {os.path.basename(f)}")
        
        self.upload_drive(f, self.sales_file_id, "sales")
        return f
    
    def export_customers(self):
        logging.info("="*70)
        logging.info("Customers...")
        
        self.driver.get(self.customer_url)
        time.sleep(4)
        
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Exportar')]").click()
        
        f = self.wait_download()
        logging.info(f"✓ {os.path.basename(f)}")
        
        self.upload_drive(f, self.customer_file_id, "customers")
        return f
    
    def wait_download(self, timeout=30):
        initial = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
        start = time.time()
        
        while time.time() - start < timeout:
            current = set(glob.glob(os.path.join(self.download_dir, "*.csv")))
            new = current - initial
            
            for f in new:
                if not f.endswith(('.crdownload', '.tmp')) and os.path.getsize(f) > 0:
                    time.sleep(1)
                    return f
            time.sleep(1)
        
        raise Exception("Download timeout")
    
    def upload_drive(self, path, fid, ftype):
        creds = Credentials.from_authorized_user_info(json.loads(self.google_creds_json))
        svc = build('drive', 'v3', credentials=creds)
        
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        name = f"{ftype}_{yesterday}.csv"
        
        media = MediaFileUpload(path, mimetype='text/csv')
        svc.files().update(fileId=fid, body={'name': name}, media_body=media).execute()
        logging.info(f"✓ Drive: {name}")
    
    def run(self):
        try:
            self.driver = self.setup_driver()
            
            self.login()
            self.export_sales()
            self.export_customers()
            
            logging.info("="*70)
            logging.info("✓ SUCCESS")
            logging.info("="*70)
            return True
            
        except Exception as e:
            logging.error(f"✗ {e}", exc_info=True)
            self.driver.save_screenshot("error.png")
            return False
        finally:
            if self.driver:
                self.driver.quit()

def main():
    exit(0 if LavapopAutomation().run() else 1)

if __name__ == "__main__":
    main()
