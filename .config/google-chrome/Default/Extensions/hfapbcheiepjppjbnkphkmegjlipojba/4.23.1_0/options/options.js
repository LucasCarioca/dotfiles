// Saves options to chrome.storage.sync.
function save_options() {
    var apiServer = document.getElementById('apiServer').value;
    var wwwServer = document.getElementById('wwwServer').value;
    var emulateDevice = document.getElementById('emulateDevice').value;

    chrome.storage.local.get(['_piggy.id'], function(data) {
        chrome.runtime.setUninstallURL(apiServer + '/ext/uninstall?app_uid=' + data['_piggy.id'] + '&v=' + chrome.runtime.getManifest().version, function() {});
    });
    chrome.storage.local.set({
        apiServer: apiServer,
        wwwServer: wwwServer,
        emulateDevice: emulateDevice
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.innerHTML = 'Options saved. Reload (Cmd+&#8984; or Ctrl+R) the page for changes to take effect.';
        status.style.display = 'block';
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default values
    chrome.storage.local.get({
        apiServer: '',
        wwwServer: '',
        emulateDevice: ''
    }, function(items) {
        document.getElementById('apiServer').value = items.apiServer;
        document.getElementById('wwwServer').value = items.wwwServer;
        document.getElementById('emulateDevice').value = items.emulateDevice;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
