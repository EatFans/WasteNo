// 默认设置
let settings = {
    antiCopyDisable: true,
    antiPasteDisable: true,
    antiSwitchDetect: true,
    enableConsoleLog: false
};

// 标记是否是首次加载
let isInitialLoad = true;

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
    applySettings(true); // 传入 true 表示是初始化
    isInitialLoad = false;
});

// 监听设置变化
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_CHANGED') {
        const oldSettings = {...settings};
        settings = message.settings;
        log('设置已更新:', settings);
        applySettings(false, oldSettings); // 传入 false 和旧设置
    }
});

// 应用设置
function applySettings(isInit = false, oldSettings = null) {
    if (isInit) {
        // 初始化时打印所有启用的功能
        log('开始初始化功能...');

        if (settings.antiCopyDisable) {
            log('✓ 反制禁用复制 已启用');
            enableCopy();
        }

        if (settings.antiPasteDisable) {
            log('✓ 反制禁止粘贴 已启用');
            enablePaste();
        }

        if (settings.antiSwitchDetect) {
            log('✓ 反制切屏检查 已启用');
            disableSwitchDetection();
        }

        logInfo('所有功能初始化完成');
    } else {
        // 运行时只打印变化的功能
        if (oldSettings && settings.antiCopyDisable !== oldSettings.antiCopyDisable) {
            if (settings.antiCopyDisable) {
                log('✓ 反制禁用复制 已启用');
                enableCopy();
            } else {
                log('✗ 反制禁用复制 已关闭');
                disableCopy();
            }
        }

        if (oldSettings && settings.antiPasteDisable !== oldSettings.antiPasteDisable) {
            if (settings.antiPasteDisable) {
                log('✓ 反制禁止粘贴 已启用');
                enablePaste();
            } else {
                log('✗ 反制禁止粘贴 已关闭');
                disablePaste();
            }
        }

        if (oldSettings && settings.antiSwitchDetect !== oldSettings.antiSwitchDetect) {
            if (settings.antiSwitchDetect) {
                log('✓ 反制切屏检查 已启用');
                disableSwitchDetection();
            } else {
                log('✗ 反制切屏检查 已关闭');
                enableSwitchDetection();
            }
        }

        // 日志开关变化的提示
        if (oldSettings && settings.enableConsoleLog !== oldSettings.enableConsoleLog) {
            if (settings.enableConsoleLog) {
                console.log('%c[Wasteno] 控制台日志已启用 ✓', 'color: #4A90E2; font-weight: bold;');
            } else {
                console.log('%c[Wasteno] 控制台日志已关闭', 'color: #999; font-weight: bold;');
            }
        }
    }
}

// 存储事件处理器，以便后续移除
let copyHandlers = {
    copy: null,
    cut: null,
    selectstart: null,
    contextmenu: null
};
let copyStyleElement = null;

// 允许复制
function enableCopy() {
    // 如果已经启用，先禁用
    if (copyHandlers.copy) {
        disableCopy();
    }

    // 移除复制相关的事件监听
    copyHandlers.copy = (e) => {
        e.stopPropagation();
        log('已拦截复制限制');
    };
    document.addEventListener('copy', copyHandlers.copy, true);

    copyHandlers.cut = (e) => {
        e.stopPropagation();
        log('已拦截剪切限制');
    };
    document.addEventListener('cut', copyHandlers.cut, true);

    // 移除选择文本的限制
    copyHandlers.selectstart = (e) => {
        e.stopPropagation();
    };
    document.addEventListener('selectstart', copyHandlers.selectstart, true);

    copyHandlers.contextmenu = (e) => {
        e.stopPropagation();
    };
    document.addEventListener('contextmenu', copyHandlers.contextmenu, true);

    // 移除 CSS 中的禁止选择样式
    copyStyleElement = document.createElement('style');
    copyStyleElement.textContent = `
        * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    copyStyleElement.setAttribute('data-wasteno-copy', 'true');
    document.head.appendChild(copyStyleElement);
}

// 禁用复制功能
function disableCopy() {
    // 移除事件监听器
    if (copyHandlers.copy) {
        document.removeEventListener('copy', copyHandlers.copy, true);
        copyHandlers.copy = null;
    }
    if (copyHandlers.cut) {
        document.removeEventListener('cut', copyHandlers.cut, true);
        copyHandlers.cut = null;
    }
    if (copyHandlers.selectstart) {
        document.removeEventListener('selectstart', copyHandlers.selectstart, true);
        copyHandlers.selectstart = null;
    }
    if (copyHandlers.contextmenu) {
        document.removeEventListener('contextmenu', copyHandlers.contextmenu, true);
        copyHandlers.contextmenu = null;
    }

    // 移除样式
    if (copyStyleElement && copyStyleElement.parentNode) {
        copyStyleElement.parentNode.removeChild(copyStyleElement);
        copyStyleElement = null;
    }
}

// 存储粘贴事件处理器
let pasteHandlers = {
    paste: null,
    input: null
};

// 允许粘贴
function enablePaste() {
    // 如果已经启用，先禁用
    if (pasteHandlers.paste) {
        disablePaste();
    }

    pasteHandlers.paste = (e) => {
        e.stopPropagation();
        log('已拦截粘贴限制');
    };
    document.addEventListener('paste', pasteHandlers.paste, true);

    // 监听输入框，移除粘贴限制
    pasteHandlers.input = (e) => {
        if (e.target.matches('input, textarea')) {
            e.target.onpaste = null;
        }
    };
    document.addEventListener('input', pasteHandlers.input, true);
}

// 禁用粘贴功能
function disablePaste() {
    if (pasteHandlers.paste) {
        document.removeEventListener('paste', pasteHandlers.paste, true);
        pasteHandlers.paste = null;
    }
    if (pasteHandlers.input) {
        document.removeEventListener('input', pasteHandlers.input, true);
        pasteHandlers.input = null;
    }
}

// 存储切屏检测事件处理器
let switchHandlers = {
    visibilitychange: null,
    blur: null,
    focus: null,
    pagehide: null,
    pageshow: null
};
let switchPropertiesOverridden = false;

// 禁用切屏检查
function disableSwitchDetection() {
    // 如果已经启用，先禁用
    if (switchHandlers.visibilitychange) {
        enableSwitchDetection();
    }

    // 阻止 visibilitychange 事件
    switchHandlers.visibilitychange = (e) => {
        e.stopImmediatePropagation();
        log('已拦截切屏检测 (visibilitychange)');
    };
    document.addEventListener('visibilitychange', switchHandlers.visibilitychange, true);

    // 阻止 blur 事件
    switchHandlers.blur = (e) => {
        e.stopImmediatePropagation();
        log('已拦截失焦检测 (blur)');
    };
    window.addEventListener('blur', switchHandlers.blur, true);

    // 阻止 focus 事件
    switchHandlers.focus = (e) => {
        e.stopImmediatePropagation();
    };
    window.addEventListener('focus', switchHandlers.focus, true);

    // 阻止 pagehide 事件
    switchHandlers.pagehide = (e) => {
        e.stopImmediatePropagation();
        log('已拦截页面隐藏检测 (pagehide)');
    };
    window.addEventListener('pagehide', switchHandlers.pagehide, true);

    // 阻止 pageshow 事件
    switchHandlers.pageshow = (e) => {
        e.stopImmediatePropagation();
    };
    window.addEventListener('pageshow', switchHandlers.pageshow, true);

    // 覆盖 document.hidden 属性
    if (!switchPropertiesOverridden) {
        Object.defineProperty(document, 'hidden', {
            get: () => false,
            configurable: true
        });

        // 覆盖 document.visibilityState 属性
        Object.defineProperty(document, 'visibilityState', {
            get: () => 'visible',
            configurable: true
        });

        switchPropertiesOverridden = true;
    }
}

// 启用切屏检查（恢复正常行为）
function enableSwitchDetection() {
    // 移除事件监听器
    if (switchHandlers.visibilitychange) {
        document.removeEventListener('visibilitychange', switchHandlers.visibilitychange, true);
        switchHandlers.visibilitychange = null;
    }
    if (switchHandlers.blur) {
        window.removeEventListener('blur', switchHandlers.blur, true);
        switchHandlers.blur = null;
    }
    if (switchHandlers.focus) {
        window.removeEventListener('focus', switchHandlers.focus, true);
        switchHandlers.focus = null;
    }
    if (switchHandlers.pagehide) {
        window.removeEventListener('pagehide', switchHandlers.pagehide, true);
        switchHandlers.pagehide = null;
    }
    if (switchHandlers.pageshow) {
        window.removeEventListener('pageshow', switchHandlers.pageshow, true);
        switchHandlers.pageshow = null;
    }

    // 注意：无法恢复被覆盖的 document.hidden 和 document.visibilityState 属性
    // 因为我们不知道原始的 getter 函数，且 configurable 为 true 意味着可以重新定义
    // 但重新定义会需要刷新页面才能完全恢复
    logWarn('切屏检测已禁用，但某些属性覆盖需要刷新页面才能完全恢复');
}

// 初始化时不调用 applySettings，因为已在 chrome.storage.sync.get 回调中调用

// 始终输出加载信息（不受日志开关控制）
console.log('%c[Wasteno] 反制脚本已加载 ✓', 'color: #4A90E2; font-weight: bold;');
