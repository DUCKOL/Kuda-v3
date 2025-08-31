<!-- src/App.vue (最终浑然一体视觉版) -->
<template>
  <div class="container">
    <!-- 顶部登录区 -->
    <div class="login-section section-padding draggable"> 
      <div class="title-bar no-drag">
        <span class="feather-icon">✒️</span>
        <h3>快答AI 客户端</h3>
      </div>
      <div class="form-group no-drag">
        <label for="email">邮箱:</label>
        <input type="email" id="email" v-model="email" :disabled="userStore.isLoggedIn" class="no-drag" />
      </div>
      <div class="form-group no-drag">
        <label for="password">密码:</label>
        <input type="password" id="password" v-model="password" :disabled="userStore.isLoggedIn" class="no-drag" />
      </div>
      <button class="login-btn no-drag" @click="handleLogin" :disabled="userStore.isLoggedIn">
        {{ userStore.isLoggedIn ? '已登录' : '登录' }}
      </button>
    </div>

    <!-- 中部状态与设置区 -->
    <div class="settings-section section-padding no-drag"> 
      <div class="version-info">v0.020</div>
      <div class="status-line">
        <span>WebSocket状态:</span>
        <span :class="websocketStore.isConnected ? 'status-connected' : 'status-disconnected'">
          {{ websocketStore.isConnected ? '已连接' : '未连接' }}
        </span>
        <button class="disconnect-btn" @click="handleLogout" :disabled="!userStore.isLoggedIn">断开连接</button>
      </div>
      <div class="prompt-section">
        <label>提示词 <small>(可根据需要自行修改):</small></label>
        <textarea v-model="prompt"></textarea>
      </div>
      <div class="current-model-display">
        当前模型: <strong>{{ currentModel }}</strong>
      </div>
    </div>

    <!-- 底部功能区 -->
    <div class="actions-section section-padding no-drag">
      <div class="screenshot-actions">
        <!-- 自动截图复选框 -->
        <div class="checkbox-group">
          <input type="checkbox" id="auto-screenshot-toggle" v-model="isAutoScreenshotEnabled" :disabled="!userStore.isLoggedIn">
          <label for="auto-screenshot-toggle">点击客户端窗口3秒后全屏截图</label>
        </div>
      </div>
      <div class="hotkey-info">
        <h4>截图热键</h4>
        <p><strong>Shift+Z:</strong> 全屏截图</p>
        <p><strong>Alt+Z:</strong> 切换AI模型</p>
      </div>
    </div>
    
    <!-- 最底部状态栏 -->
    <div class="footer-bar no-drag">
      <span>使用状态: {{ userStore.isLoggedIn ? '已就绪' : '就绪，请登录' }}</span>
      <span>用户名: {{ userStore.email || '未登录' }}</span>
      <div>
        <button class="footer-btn no-drag">本软件完全免费，请勿</button>
        <button class="footer-btn no-drag">使用教程</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from './stores/user';
import { useWebsocketStore } from './stores/websocket';

// @ts-ignore
const { ipcRenderer } = require('electron');

const userStore = useUserStore();
const websocketStore = useWebsocketStore();

const email = ref('');
const password = ref('');
const prompt = ref('请整理当前这张图片中的问题，并且回答问题给出答案。');

const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']; 
const currentModelIndex = ref(0);
const currentModel = ref(models[currentModelIndex.value]);

const isAutoScreenshotEnabled = ref(false);
let mouseClickListener: ((event: MouseEvent) => void) | null = null; 
let clickTimeoutId: NodeJS.Timeout | null = null; 

const handleLogin = async () => {
  const success = await userStore.login(email.value, password.value);
  if (success && userStore.token) {
    websocketStore.connect(userStore.token);
  }
};

const handleLogout = () => {
  isAutoScreenshotEnabled.value = false;
  toggleClickListener(); 
  websocketStore.disconnect();
  userStore.logout();
};

const onMouseClick = (event: MouseEvent) => {
  if (!isAutoScreenshotEnabled.value) return; 
  if (event.button === 0) {
    if (clickTimeoutId) clearTimeout(clickTimeoutId); 
    clickTimeoutId = setTimeout(() => {
      ipcRenderer.send('request-screenshot'); 
      clickTimeoutId = null;
    }, 3000);
  }
};

const toggleClickListener = () => {
  if (isAutoScreenshotEnabled.value) {
    if (!mouseClickListener) {
      mouseClickListener = onMouseClick;
      window.addEventListener('mousedown', mouseClickListener);
    }
  } else {
    if (mouseClickListener) {
      window.removeEventListener('mousedown', mouseClickListener);
      mouseClickListener = null;
      if (clickTimeoutId) {
        clearTimeout(clickTimeoutId);
        clickTimeoutId = null;
      }
    }
  }
};

watch(() => userStore.isLoggedIn, (newVal) => {
  if (!newVal) {
    isAutoScreenshotEnabled.value = false;
    toggleClickListener();
  }
});
watch(isAutoScreenshotEnabled, toggleClickListener);

onMounted(() => {
  ipcRenderer.on('screenshot-taken', (event: any, imgBase64: string) => {
    if (!userStore.isLoggedIn || !websocketStore.isConnected) return;
    if (websocketStore.socket && userStore.userId) {
      websocketStore.socket.emit('submitQuestion', {
        userId: userStore.userId,
        image: imgBase64,
        prompt: prompt.value,
        model: currentModel.value,
      });
    }
  });

  ipcRenderer.on('screenshot-error', (event: any, errorMessage: string) => {
    alert(`截图失败: ${errorMessage}`);
  });

  ipcRenderer.on('toggle-model', () => {
    currentModelIndex.value = (currentModelIndex.value + 1) % models.length;
    currentModel.value = models[currentModelIndex.value];
  });
});

onUnmounted(toggleClickListener);
</script>

<style>
/* !! 核心改动：浑然一体的视觉样式 !! */
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; 
  background: transparent; 
}
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* !! 设置您想要的半透明背景 !! */
  background-color: rgba(245, 245, 245, 0.5); /* 85% 不透明度的浅灰色 */
  border-radius: 8px; 
  overflow: hidden; 
}

/* 为每个区域添加内边距和分隔线，以保持布局清晰 */
.section-padding {
  padding: 15px;
}
.settings-section, .actions-section {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}


/* !! 拖动和非拖动区域的样式 !! */
.draggable {
  -webkit-app-region: drag; 
  cursor: grab; 
}
.no-drag {
  -webkit-app-region: no-drag; 
  cursor: default; 
}


/* 基础样式 (大部分保持不变) */
* { box-sizing: border-box; margin: 0; padding: 0; }
button { font-family: inherit; padding: 5px 10px; border: 1px solid #ccc; border-radius: 3px; background-color: #f7f7f7; cursor: pointer; color: #333; }
button:hover { background-color: #e8e8e8; }
button:disabled { cursor: not-allowed; opacity: 0.6; }
input[type="email"], input[type="password"], textarea { 
  width: 100%; 
  padding: 8px; /* 增加内边距 */
  border: 1px solid #ccc; 
  border-radius: 4px;
  background-color: #fff; /* 输入框保持白色背景 */
}
.login-section .title-bar { display: flex; align-items: center; margin-bottom: 15px; }
.login-section .feather-icon { font-size: 18px; margin-right: 8px; }
.form-group { display: flex; align-items: center; margin-bottom: 10px; }
.form-group label { width: 50px; flex-shrink: 0; }
.login-btn { display: block; width: 100%; margin-top: 5px; padding: 8px; background-color: #007bff; color: white; }
.login-btn:disabled { background-color: #007bff; color: white; opacity: 0.7; }
.login-btn:hover:not(:disabled) { background-color: #0056b3; }
.settings-section { position: relative; }
.version-info { position: absolute; top: 10px; right: 10px; font-size: 12px; color: #888; }
.status-line { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
.status-connected { color: green; font-weight: bold; }
.status-disconnected { color: red; font-weight: bold; }
.disconnect-btn { padding: 2px 8px; }
.prompt-section label { display: block; margin-bottom: 5px; }
.prompt-section textarea { height: 80px; resize: vertical; }
.actions-section { flex-grow: 1; }
.screenshot-actions { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
.checkbox-group { display: flex; align-items: center; gap: 5px; }
.hotkey-info { border-top: 1px solid rgba(0, 0, 0, 0.1); padding-top: 15px; }
.hotkey-info h4 { margin-bottom: 10px; }
.hotkey-info p { margin-bottom: 5px; font-size: 13px; color: #555; }
.footer-bar { padding: 10px 15px; background-color: rgba(0, 0, 0, 0.05); border-top: 1px solid rgba(0, 0, 0, 0.1); font-size: 12px; color: #666; display: flex; justify-content: space-between; align-items: center; }
.footer-btn { margin-left: 10px; }
.current-model-display { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0, 0, 0, 0.1); text-align: right; font-size: 12px; color: #555; }
</style>