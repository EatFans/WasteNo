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
    console.log('[Wasteno] 从 storage 加载的设置:', settings);
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
    contextmenu: null,
    mousedown: null,
    observer: null
};
let copyStyleElement = null;

// 允许复制
function enableCopy() {
    // 如果已经启用，先禁用
    if (copyHandlers.copy) {
        disableCopy();
    }

    // 拦截复制事件，确保复制能正常工作
    copyHandlers.copy = (e) => {
        // 获取选中的文本
        const selection = window.getSelection();
        const selectedText = selection.toString();

        if (selectedText) {
            // 阻止其他监听器
            e.stopImmediatePropagation();
            e.preventDefault();

            // 手动将文本写入剪贴板
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', selectedText);
            }

            log('已拦截复制限制 (手动复制: ' + selectedText.substring(0, 20) + '...)');
        }
    };
    document.addEventListener('copy', copyHandlers.copy, true);

    copyHandlers.cut = (e) => {
        e.stopImmediatePropagation();
        log('已拦截剪切限制');
    };
    document.addEventListener('cut', copyHandlers.cut, true);

    // 拦截选择文本的限制
    copyHandlers.selectstart = (e) => {
        e.stopImmediatePropagation();
    };
    document.addEventListener('selectstart', copyHandlers.selectstart, true);

    copyHandlers.contextmenu = (e) => {
        e.stopImmediatePropagation();
    };
    document.addEventListener('contextmenu', copyHandlers.contextmenu, true);

    // 阻止网页禁用右键菜单
    copyHandlers.mousedown = (e) => {
        if (e.button === 2) { // 右键
            e.stopImmediatePropagation();
        }
    };
    document.addEventListener('mousedown', copyHandlers.mousedown, true);

    // 添加 CSS 强制允许选择
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

    // 移除所有元素的 oncopy、onselectstart、oncontextmenu 属性
    const removeAttributes = () => {
        document.querySelectorAll('*').forEach(el => {
            if (el.oncopy) el.oncopy = null;
            if (el.onselectstart) el.onselectstart = null;
            if (el.oncontextmenu) el.oncontextmenu = null;
            el.removeAttribute('oncopy');
            el.removeAttribute('onselectstart');
            el.removeAttribute('oncontextmenu');
        });
    };

    removeAttributes();

    // 监听 DOM 变化
    const observer = new MutationObserver(removeAttributes);
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });
    copyHandlers.observer = observer;
}

// 禁用复制功能
function disableCopy() {
    // 移除事件监听器
    if (copyHandlers.copy) {
        document.removeEventListener('copy', copyHandlers.copy, true);
        copyHandlers.copy = null;
        log('已移除复制事件监听器');
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
    if (copyHandlers.mousedown) {
        document.removeEventListener('mousedown', copyHandlers.mousedown, true);
        copyHandlers.mousedown = null;
    }

    // 移除样式
    if (copyStyleElement && copyStyleElement.parentNode) {
        copyStyleElement.parentNode.removeChild(copyStyleElement);
        copyStyleElement = null;
    }

    // 断开观察器
    if (copyHandlers.observer) {
        copyHandlers.observer.disconnect();
        copyHandlers.observer = null;
    }
}

// 存储粘贴事件处理器
let pasteHandlers = {
    paste: null,
    keydown: null
};

// 允许粘贴
function enablePaste() {
    // 如果已经启用，先禁用
    if (pasteHandlers.paste) {
        disablePaste();
    }

    // 方案1: 拦截 paste 事件
    pasteHandlers.paste = (e) => {
        e.stopImmediatePropagation(); // 阻止其他监听器

        const target = e.target;
        const clipboardData = e.clipboardData || window.clipboardData;

        if (clipboardData && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            const pastedText = clipboardData.getData('text/plain') || clipboardData.getData('text');

            if (pastedText) {
                // 阻止默认行为
                e.preventDefault();
                e.stopPropagation();

                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    // 对于输入框，插入文本到光标位置
                    const start = target.selectionStart || 0;
                    const end = target.selectionEnd || 0;
                    const value = target.value || '';

                    target.value = value.substring(0, start) + pastedText + value.substring(end);
                    target.selectionStart = target.selectionEnd = start + pastedText.length;

                    // 触发 input 事件，让网页知道内容变化了
                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                    target.dispatchEvent(inputEvent);

                    log('已拦截粘贴限制 (手动插入文本)');
                } else if (target.isContentEditable) {
                    // 对于可编辑元素，使用 execCommand
                    document.execCommand('insertText', false, pastedText);
                    log('已拦截粘贴限制 (contentEditable)');
                }
            }
        }
    };
    document.addEventListener('paste', pasteHandlers.paste, true);

    // 方案2: 移除输入框上的 onpaste 属性
    const removeOnPaste = () => {
        document.querySelectorAll('input, textarea').forEach(el => {
            if (el.onpaste) {
                el.onpaste = null;
            }
            // 移除 onpaste 属性
            el.removeAttribute('onpaste');
        });
    };

    // 立即执行一次
    removeOnPaste();

    // 使用 MutationObserver 监听新添加的元素
    const observer = new MutationObserver(removeOnPaste);
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });
    pasteHandlers.observer = observer;
}

// 禁用粘贴功能
function disablePaste() {
    if (pasteHandlers.paste) {
        document.removeEventListener('paste', pasteHandlers.paste, true);
        pasteHandlers.paste = null;
        log('已移除粘贴事件监听器');
    }
    if (pasteHandlers.observer) {
        pasteHandlers.observer.disconnect();
        pasteHandlers.observer = null;
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
