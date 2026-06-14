// 创建浮窗容器
function createFloatingWidget() {
  // 检查是否已经创建
  if (document.getElementById('wasteno-widget')) {
    return;
  }

  // 创建容器
  const widget = document.createElement('div');
  widget.id = 'wasteno-widget';
  widget.className = 'wasteno-minimized';

  // 最小化状态的按钮
  const minimizedBtn = document.createElement('div');
  minimizedBtn.className = 'wasteno-minimized-btn';
  minimizedBtn.textContent = '💪';
  minimizedBtn.title = 'Wasteno - 别水了';

  // 展开状态的面板
  const panel = document.createElement('div');
  panel.className = 'wasteno-panel';

  // 面板标题栏
  const header = document.createElement('div');
  header.className = 'wasteno-header';

  const title = document.createElement('span');
  title.className = 'wasteno-title';
  title.textContent = 'Wasteno - 别水了';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wasteno-close-btn';
  closeBtn.textContent = '×';
  closeBtn.title = '最小化';

  header.appendChild(title);
  header.appendChild(closeBtn);

  // 面板内容
  const content = document.createElement('div');
  content.className = 'wasteno-content';
  content.innerHTML = '<p>保持专注，别浪费时间！</p>';

  panel.appendChild(header);
  panel.appendChild(content);

  widget.appendChild(minimizedBtn);
  widget.appendChild(panel);

  document.body.appendChild(widget);

  // 事件监听
  minimizedBtn.addEventListener('click', () => {
    widget.classList.remove('wasteno-minimized');
    widget.classList.add('wasteno-expanded');
  });

  closeBtn.addEventListener('click', () => {
    widget.classList.remove('wasteno-expanded');
    widget.classList.add('wasteno-minimized');
  });

  // 使面板可拖动 - 优化版本
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseDown = (e) => {
    if (e.target === closeBtn) return;

    isDragging = true;

    // 获取当前位置
    const rect = widget.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // 移除过渡效果，使拖拽更流畅
    widget.style.transition = 'none';

    // 改变鼠标样式
    header.style.cursor = 'grabbing';

    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();

    // 计算新位置
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    // 边界检测，防止拖出视口
    const rect = widget.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // 使用 transform 而不是 left/top，性能更好
    widget.style.transform = `translate(${newX}px, ${newY}px)`;
    widget.style.left = '0';
    widget.style.top = '0';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      // 恢复过渡效果
      widget.style.transition = 'all 0.3s ease';
      // 恢复鼠标样式
      header.style.cursor = 'move';
    }
  };

  header.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // 防止拖拽时选中文本
  header.addEventListener('selectstart', (e) => e.preventDefault());
}

// 创建样式
function injectStyles() {
  if (document.getElementById('wasteno-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'wasteno-styles';
  style.textContent = `
    #wasteno-widget {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      transition: all 0.3s ease;
    }

    /* 最小化状态 */
    #wasteno-widget.wasteno-minimized {
      right: 20px;
      bottom: 20px;
      width: 56px;
      height: 56px;
    }

    #wasteno-widget.wasteno-minimized .wasteno-panel {
      display: none;
    }

    #wasteno-widget.wasteno-minimized .wasteno-minimized-btn {
      display: flex;
    }

    /* 展开状态 */
    #wasteno-widget.wasteno-expanded {
      right: 20px;
      bottom: 20px;
      width: 320px;
      height: auto;
    }

    #wasteno-widget.wasteno-expanded .wasteno-minimized-btn {
      display: none;
    }

    #wasteno-widget.wasteno-expanded .wasteno-panel {
      display: flex;
    }

    /* 最小化按钮 */
    .wasteno-minimized-btn {
      width: 56px;
      height: 56px;
      background: #4A90E2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      user-select: none;
    }

    .wasteno-minimized-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    /* 面板 */
    .wasteno-panel {
      flex-direction: column;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    /* 标题栏 */
    .wasteno-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #4A90E2;
      color: white;
      cursor: grab;
      user-select: none;
    }

    .wasteno-header:active {
      cursor: grabbing;
    }

    .wasteno-title {
      font-size: 14px;
      font-weight: 600;
    }

    .wasteno-close-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 4px;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
      padding: 0;
    }

    .wasteno-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* 内容区域 */
    .wasteno-content {
      padding: 16px;
      min-height: 100px;
      color: #333;
    }

    .wasteno-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
    }
  `;

  document.head.appendChild(style);
}

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    createFloatingWidget();
  });
} else {
  injectStyles();
  createFloatingWidget();
}