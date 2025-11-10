"""
v2.5 - Extract data-s parameter for Enterprise
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

VERSION = "2.5"
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s', handlers=[logging.FileHandler('pos_automation.log'), logging.StreamHandler()])

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
        logging.info(f"v{VERSION} - Extract data-s for Enterprise")
        
    def setup_driver(self):
        opts = Options()
        opts.add_argument('--headless=new')
        opts.add_argument('--no-sandbox')
        opts.add_argument('--disable-dev-shm-usage')
        opts.add_argument('--window-size=1920,1080')
        opts.add_experimental_option("prefs", {"download.default_directory": self.download_dir, "download.prompt_for_download": False})
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        driver = webdriver.Chrome(options=opts)
        driver.command_executor._commands["send_command"] = ("POST", '/session/$sessionId/chromium/send_command')
        driver.execute("send_command", {'cmd': 'Page.setDownloadBehavior', 'params': {'behavior': 'allow', 'downloadPath': self.download_dir}})
        return driver
    
    def login(self):
        logging.info("Login...")
        self.driver.get(self.pos_url)
        WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="email"]')))
        time.sleep(2)
        
        self.driver.find_element(By.CSS_SELECTOR, 'input[name="email"]').send_keys(self.username)
        self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys(self.password)
        logging.info("✓ Credentials")
        
        WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'iframe[src*="recaptcha"]')))
        
        # Extract sitekey and data-s
        params = self.driver.execute_script('''
            var sitekey = null;
            var dataS = null;
            
            // Get sitekey from div
            var div = document.querySelector('.g-recaptcha');
            if (div) {
                sitekey = div.getAttribute('data-sitekey');
                dataS = div.getAttribute('data-s');
            }
            
            // Fallback to iframe
            if (!sitekey) {
                var iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
                for (var i = 0; i < iframes.length; i++) {
                    var src = iframes[i].src;
                    if (src.includes('k=')) {
                        sitekey = src.split('k=')[1].split('&')[0];
                        break;
                    }
                }
            }
            
            return {sitekey: sitekey, dataS: dataS};
        ''')
        
        sitekey = params['sitekey']
        data_s = params['dataS']
        
        if not sitekey:
            raise Exception("No sitekey")
        
        logging.info(f"Sitekey: {sitekey}")
        logging.info(f"data-s: {data_s if data_s else 'NOT FOUND'}")
        
        # Solve with data-s if available
        solve_params = {
            'sitekey': sitekey,
            'url': self.driver.current_url,
            'enterprise': 1
        }
        
        if data_s:
            solve_params['datas'] = data_s  # Note: 'datas' not 'data-s' per 2captcha docs
            logging.info("✓ Sending with Enterprise payload")
        else:
            logging.warning("⚠ No data-s found - may fail")
        
        result = self.solver.recaptcha(**solve_params)
        token = result['code']
        logging.info(f"✓ Token: {token[:40]}...")
        
        # Inject
        self.driver.execute_script(f'''
            var t = "{token}";
            var ta = document.getElementById("g-recaptcha-response");
            ta.value = t;
            ta.innerHTML = t;
            ta.style.display = "block";
            if (typeof ___grecaptcha_cfg !== 'undefined') {{
                var c = ___grecaptcha_cfg.clients;
                for (var i in c) for (var w in c[i]) if (c[i][w] && c[i][w].callback) c[i][w].callback(t);
            }}
        ''')
        
        logging.info("✓ Injected")
        time.sleep(3)
        
        self.driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]").click()
        logging.info("✓ Submitted")
        time.sleep(5)
        
        if "preencha o captcha" in self.driver.find_element(By.TAG_NAME, "body").text.lower():
            logging.error("✗ FAILED - Token rejected even with data-s")
            logging.error("   This site likely validates: risk score + project ID + IP")
            logging.error("   2Captcha cannot bypass this level of Enterprise protection")
            logging.error("")
            logging.error("SOLUTION: Use cookie-based authentication:")
            logging.error("   1. Log in manually once")
            logging.error("   2. Export cookies")
            logging.error("   3. Automation loads cookies (no CAPTCHA needed)")
            raise Exception("Enterprise validation impossible with 2Captcha")
        
        if 'system' in self.driver.current_url:
            logging.info(f"✓ SUCCESS: {self.driver.current_url}")
            return True
        raise Exception("No redirect")
    
    def export_sales(self):
        logging.info("Sales...")
        self.driver.get(self.sales_url)
        time.sleep(4)
        self.driver.find_element(By.XPATH, "//*[contains(text(), 'Ontem')]").click()
        time.sleep(2)
        opts = self.driver.find_elements(By.XPATH, "//*[text()='Ontem']")
        if len(opts) > 1: opts[1].click()
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
            for f in current - initial:
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
        svc.files().update(fileId=fid, body={'name': name}, media_body=MediaFileUpload(path, mimetype='text/csv')).execute()
        logging.info(f"✓ Drive: {name}")
    
    def run(self):
        try:
            self.driver = self.setup_driver()
            self.login()
            self.export_sales()
            self.export_customers()
            logging.info("✓ COMPLETE")
            return True
        except Exception as e:
            logging.error(f"✗ {e}", exc_info=True)
            self.driver.save_screenshot("error.png")
            return False
        finally:
            if self.driver: self.driver.quit()

def main():
    exit(0 if LavapopAutomation().run() else 1)

if __name__ == "__main__":
    main()
