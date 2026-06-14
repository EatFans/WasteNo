// 默认设置
let settings = {
    antiCopyDisable: true,
    antiPasteDisable: true,
    antiSwitchDetect: true,
    enableConsoleLog: false
};

// 日志工具函数
function log(...args) {
    if (settings.enableConsoleLog) {
        console.log('[Wasteno]', ...args);
    }
}

function logInfo(...args) {
    if (settings.enableConsoleLog) {
        console.info('[Wasteno]', ...args);
    }
}

function logWarn(...args) {
    if (settings.enableConsoleLog) {
        console.warn('[Wasteno]', ...args);
    }
}

// 从 storage 加载设置
chrome.storage.sync.get({
    antiCopyDisable: true,
    antiPasteDisable: true,
    antiSwitchDetect: true,
    enableConsoleLog: false
}, (items) => {
    settings = items;
    log('设置已加载:', settings);
    applySettings();
});

// 监听设置变化
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_CHANGED') {
        settings = message.settings;
        log('设置已更新:', settings);
        applySettings();
    }
});

// 应用设置
function applySettings() {
    log('开始应用设置...');

    // 反制禁用复制
    if (settings.antiCopyDisable) {
        log('启用反制禁用复制功能');
        enableCopy();
    } else {
        log('反制禁用复制功能已关闭');
    }

    // 反制禁止粘贴
    if (settings.antiPasteDisable) {
        log('启用反制禁止粘贴功能');
        enablePaste();
    } else {
        log('反制禁止粘贴功能已关闭');
    }

    // 反制切屏检查
    if (settings.antiSwitchDetect) {
        log('启用反制切屏检查功能');
        disableSwitchDetection();
    } else {
        log('反制切屏检查功能已关闭');
    }

    logInfo('所有设置已应用完成');
}

// 允许复制
function enableCopy() {
    log('正在设置复制功能...');

    // 移除复制相关的事件监听
    document.addEventListener('copy', (e) => {
        e.stopPropagation();
        log('拦截并允许复制事件');
    }, true);

    document.addEventListener('cut', (e) => {
        e.stopPropagation();
        log('拦截并允许剪切事件');
    }, true);

    // 移除选择文本的限制
    document.addEventListener('selectstart', (e) => {
        e.stopPropagation();
    }, true);

    document.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
    }, true);

    // 移除 CSS 中的禁止选择样式
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(style);
    log('已注入允许选择文本的样式');
}

// 允许粘贴
function enablePaste() {
    log('正在设置粘贴功能...');

    document.addEventListener('paste', (e) => {
        e.stopPropagation();
        log('拦截并允许粘贴事件');
    }, true);

    // 监听输入框，移除粘贴限制
    document.addEventListener('input', (e) => {
        if (e.target.matches('input, textarea')) {
            e.target.onpaste = null;
        }
    }, true);

    log('粘贴功能设置完成');
}

// 禁用切屏检查
function disableSwitchDetection() {
    log('正在设置切屏检查反制...');

    // 阻止 visibilitychange 事件
    document.addEventListener('visibilitychange', (e) => {
        e.stopImmediatePropagation();
        log('已拦截 visibilitychange 事件');
    }, true);

    // 阻止 blur 事件
    window.addEventListener('blur', (e) => {
        e.stopImmediatePropagation();
        log('已拦截 blur 事件');
    }, true);

    // 阻止 focus 事件
    window.addEventListener('focus', (e) => {
        e.stopImmediatePropagation();
    }, true);

    // 阻止 pagehide 事件
    window.addEventListener('pagehide', (e) => {
        e.stopImmediatePropagation();
        log('已拦截 pagehide 事件');
    }, true);

    // 阻止 pageshow 事件
    window.addEventListener('pageshow', (e) => {
        e.stopImmediatePropagation();
    }, true);

    // 覆盖 document.hidden 属性
    Object.defineProperty(document, 'hidden', {
        get: () => false,
        configurable: true
    });

    // 覆盖 document.visibilityState 属性
    Object.defineProperty(document, 'visibilityState', {
        get: () => 'visible',
        configurable: true
    });

    log('已覆盖 document.hidden 和 document.visibilityState');
    log('切屏检查反制设置完成');
}

// 初始化
applySettings();

// 始终输出加载信息（不受日志开关控制）
console.log('%c[Wasteno] 反制脚本已加载 ✓', 'color: #4A90E2; font-weight: bold;');
