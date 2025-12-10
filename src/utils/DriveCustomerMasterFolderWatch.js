const CusfolderId = '1vt8D_hZu6MP0F7w5S5AqEREcZi-m7fGh';
const CuswebhookUrl = 'https://hook.us2.make.com/h6mv6krm8bucbx1muv4q3slavu5viqg3';

const Cuscache = CacheService.getScriptCache();

function isRecentlyCreated(file) {
    const now = new Date();
    const threshold = 60 * 60 * 1000; // Check for files created in the last minute (adjust as needed)
    return now - file.getLastUpdated() < threshold;
}

function checkForNewFiles() {
    const folder = DriveApp.getFolderById(CusfolderId);
    const files = folder.getFiles();

    let newFilesFound = false;

    while (files.hasNext()) {
        const file = files.next();
        const CusFileId = file.getId();

        // Check cache for processed CusFileId
        if (!Cuscache.get(CusFileId)) {
            if (isRecentlyCreated(file)) {
                const payload = { CusFileId };
                UrlFetchApp.fetch(CuswebhookUrl, {
                    method: 'post',
                    contentType: 'application/json',
                    payload: JSON.stringify(payload)
                });
                Cuscache.put(CusFileId, 'processed', 60 * 60); // Cache processed CusFileId for 1 hour
                console.log(`New file found: ${CusFileId}`);
                newFilesFound = true;
            }
        } else {
            console.log(`File ${CusFileId} already processed`);
        }
    }

    if (!newFilesFound) {
        console.log('No new files found');
    }
}

function startMonitoring() {
    // Schedule a function to check for new files periodically (e.g., every minute)
    ScriptApp.newTrigger('checkForNewFiles')
        .timeBased()
        .everyHours(1)
        .create();
}

function main() {
    startMonitoring();
}