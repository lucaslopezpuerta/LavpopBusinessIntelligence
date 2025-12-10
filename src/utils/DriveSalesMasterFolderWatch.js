// Replace 'myFolderID' with the actual ID of your folder and 'https://mysample.webhook.com' with your webhook URL
const folderId = '1xcGVnBLhz6uccPPKIloKtiMfnm04gcBv';
const webhookUrl = 'https://hook.us2.make.com/6cqex71ym7ltt69nvqekspo8orr2mvzl';

const cache = CacheService.getScriptCache();

function isRecentlyCreated(file) {
    const now = new Date();
    const threshold = 60 * 60 * 1000; // Check for files created in the last minute (adjust as needed)
    return now - file.getLastUpdated() < threshold;
}

function checkForNewSalesFiles() {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();

    let newFilesFound = false;

    while (files.hasNext()) {
        const file = files.next();
        const fileId = file.getId();

        // Check cache for processed fileId
        if (!cache.get(fileId)) {
            if (isRecentlyCreated(file)) {
                const payload = { fileId };
                UrlFetchApp.fetch(webhookUrl, {
                    method: 'post',
                    contentType: 'application/json',
                    payload: JSON.stringify(payload)
                });
                cache.put(fileId, 'processed', 60 * 60); // Cache processed fileId for 1 hour
                console.log(`New file found: ${fileId}`);
                newFilesFound = true;
            }
        } else {
            console.log(`File ${fileId} already processed`);
        }
    }

    if (!newFilesFound) {
        console.log('No new files found');
    }
}

function startMonitoring() {
    // Schedule a function to check for new files periodically (e.g., every minute)
    ScriptApp.newTrigger('checkForNewSalesFiles')
        .timeBased()
        .everyHours(1)
        .create();
}

function main() {
    startMonitoring();
}