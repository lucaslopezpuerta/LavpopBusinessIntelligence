How to Solving reCAPTCHA Using Java
Prerequisites
Before we dive into the code, there are a few prerequisites you should have in place to follow along with this tutorial successfully:

Node.js and npm: We will be using Node.js, a JavaScript runtime, along with npm (Node Package Manager) to manage our project’s dependencies. If you don’t have Node.js installed, you can download it from the official Node.js website.
CapSolver API Key: To effectively solve reCAPTCHA challenges, you'll need access to a service like CapSolver, which specializes in solving CAPTCHA challenges programmatically. Make sure you sign up and obtain an API key from CapSolver to integrate it into your solution.
Once you’ve met these prerequisites, you’re ready to set up your environment and start solving reCAPTCHA challenges with JavaScript and CapSolver.

Step 1: Obtaining the Site Key
In the browser’s request logs, search for the request
/recaptcha/api2/reload?k=6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-, where the value after k= is the Site Key we need. Or you can find all the paramters to solve recapctha through CapSolver extension
The URL is the address of the page that triggers the reCAPTCHA V2.
Step 2: Install the requests library
bash
Copy
pip install requests
Step 3: Example code
python
Copy
import requests
import time
from DrissionPage import ChromiumPage

# Create an instance of ChromiumPage
page = ChromiumPage()

# Access the example page that triggers reCAPTCHA
page.get("https://www.google.com/recaptcha/api2/demo")

# TODO: Set your configuration
api_key = "your api key of capsolver"  # Your CapSolver API key
site_key = "6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-"  # Site key of your target site
site_url = "https://www.google.com/recaptcha/api2/demo"  # Page URL of your target site

def capsolver():
    payload = {
        "clientKey": api_key,
        "task": {
            "type": 'ReCaptchaV2TaskProxyLess',
            "websiteKey": site_key,
            "websiteURL": site_url
        }
    }
    # Send a request to CapSolver to create a task
    res = requests.post("https://api.capsolver.com/createTask", json=payload)
    resp = res.json()
    task_id = resp.get("taskId")
    if not task_id:
        print("Failed to create task:", res.text)
        return
    print(f"Got taskId: {task_id} / Getting result...")

    while True:
        time.sleep(3)  # Delay
        payload = {"clientKey": api_key, "taskId": task_id}
        # Query task results
        res = requests.post("https://api.capsolver.com/getTaskResult", json=payload)
        resp = res.json()
        status = resp.get("status")
        if status == "ready":
            return resp.get("solution", {}).get('gRecaptchaResponse')
        if status == "failed" or resp.get("errorId"):
            print("Solve failed! response:", res.text)
            return

def check():
    # Get the reCAPTCHA solution
    token = capsolver()
    # Set the reCAPTCHA response value
    page.run_js(f'document.getElementById("g-recaptcha-response").value="{token}"')
    # Call the success callback function
    page.run_js(f'onSuccess("{token}")')
    # Submit the form
    page.ele('x://input[@id="recaptcha-demo-submit"]').click()

if __name__ == '__main__':
    check()