// 获取所有开关元素
const antiCopyDisable = document.getElementById('antiCopyDisable');
const antiPasteDisable = document.getElementById('antiPasteDisable');
const antiSwitchDetect = document.getElementById('antiSwitchDetect');
const enableConsoleLog = document.getElementById('enableConsoleLog');

// 从 storage 中加载设置
function loadSettings() {
    chrome.storage.sync.get({
        antiCopyDisable: true,
        antiPasteDisable: true,
        antiSwitchDetect: true,
        enableConsoleLog: false
    }, (items) => {
        antiCopyDisable.checked = items.antiCopyDisable;
        antiPasteDisable.checked = items.antiPasteDisable;
        antiSwitchDetect.checked = items.antiSwitchDetect;
        enableConsoleLog.checked = items.enableConsoleLog;
    });
}

// 保存设置到 storage
function saveSettings() {
    const settings = {
        antiCopyDisable: antiCopyDisable.checked,
        antiPasteDisable: antiPasteDisable.checked,
        antiSwitchDetect: antiSwitchDetect.checked,
        enableConsoleLog: enableConsoleLog.checked
    };

    chrome.storage.sync.set(settings, () => {
        console.log('设置已保存:', settings);

        // 通知所有标签页设置已更改
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'SETTINGS_CHANGED',
                    settings: settings
                }).catch(() => {
                    // 忽略无法发送消息的标签页（如chrome://页面）
                });
            });
        });
    });
}

// 为每个开关添加事件监听器
antiCopyDisable.addEventListener('change', saveSettings);
antiPasteDisable.addEventListener('change', saveSettings);
antiSwitchDetect.addEventListener('change', saveSettings);
enableConsoleLog.addEventListener('change', saveSettings);

// 页面加载时加载设置
document.addEventListener('DOMContentLoaded', loadSettings);

