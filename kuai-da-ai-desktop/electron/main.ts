// import { app, BrowserWindow, globalShortcut } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import screenshot from 'screenshot-desktop';
// import os from 'node:os'; // 引入 os 模块来获取系统临时文件夹路径

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Vite 开发服务器 URL 的环境变量
// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let win: BrowserWindow | null;

// function createWindow() {
//   win = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       // 指定预加载脚本的路径
//       preload: path.join(__dirname, 'preload.js'),
//       // !! 核心改动：我们需要在 Vue 应用中读写本地文件，所以必须启用 Node.js 集成 !!
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//   });

//   // 加载页面
//   if (process.env.VITE_DEV_SERVER_URL) {
//     win.loadURL(process.env.VITE_DEV_SERVER_URL);
//     win.webContents.openDevTools();
//   } else {
//     win.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }

// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createWindow();

//   // --- 注册全局快捷键 ---

//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, async () => {
//     console.log(`[Main Process] 热键 ${screenshotShortcut} 按下，准备保存截图到本地...`);
    
//     // 生成一个带时间戳的、唯一的临时文件名
//     const tempPath = path.join(os.tmpdir(), `kuaida_screenshot_${Date.now()}.png`);

//     try {
//       // 调用 screenshot-desktop 将高清截图直接保存到指定文件路径
//       const finalPath = await screenshot({ filename: tempPath });
      
//       console.log(`[Main Process] 截图已成功保存到: ${finalPath}`);
      
//       // 将这个临时文件的【绝对路径】发送给渲染进程（Vue 应用）
//       win?.webContents.send('screenshot-saved', finalPath);
      
//     } catch (error) {
//       console.error('[Main Process] 保存截图到文件失败:', error);
//     }
//   })) {
//     console.log(`[Main Process] 快捷键 ${screenshotShortcut} 注册失败`);
//   }

//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     console.log(`[Main Process] 热键 ${toggleModelShortcut} 按下，通知渲染进程切换模型...`);
//     win?.webContents.send('toggle-model');
//   })) {
//     console.log(`[Main Process] 快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     globalShortcut.unregisterAll();
//     app.quit();
//   }
// });

// app.on('will-quit', () => {
//   globalShortcut.unregisterAll();
// });



// // electron/main.ts (最终窗口置顶+内部点击监听版)

// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null; // 主应用窗口 (重命名为 mainWindow)

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true, // !! 核心改动：使窗口始终在最上层 !!
//     frame: false, // 移除窗口边框，使应用看起来更像一个浮动工具
//     transparent: true, // 透明背景，可以自定义样式
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }

// // 独立的截图函数，被热键和 IPC 消息调用
// async function captureScreenshotAndSendToRenderer() {
//   if (!mainWindow) return;
//   try {
//     const sources = await desktopCapturer.getSources({ types: ['screen'] });
//     const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];

//     if (primaryScreen) {
//       const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//       const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//       console.log('[Main Process] 截图成功, 准备将 Base64 数据发送到渲染进程...');
//       mainWindow.webContents.send('screenshot-taken', imgBase64);
//     } else {
//       throw new Error('找不到可用的屏幕源');
//     }
//   } catch (error) {
//     console.error('[Main Process] 截图失败:', error);
//     mainWindow.webContents.send('screenshot-error', (error as Error).message);
//   }
// }


// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();
//   // 不再创建 createInvisibleClickListenerWindow();


//   // --- IPC 通信监听 (与渲染进程交互) ---
//   // 渲染进程请求主进程进行截图
//   ipcMain.on('request-screenshot', () => {
//     console.log('[Main Process] 收到渲染进程的截图请求...');
//     captureScreenshotAndSendToRenderer();
//   });

//   // 移除 set-global-mouse-listener-status 监听，因为它不再需要
//   // ipcMain.on('set-global-mouse-listener-status', (event, enable: boolean) => { ... });


//   // --- 注册全局快捷键 ---

//   // 1. 注册全屏截图快捷键 (Ctrl+Alt+S)
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, () => {
//     console.log(`[Main Process] 快捷键 ${screenshotShortcut} 被按下, 立即触发截图...`);
//     captureScreenshotAndSendToRenderer();
//   })) {
//     console.log(`[Main Process] 快捷键 ${screenshotShortcut} 注册失败`);
//   }

//   // 2. 注册切换模型快捷键 (Alt+Z)
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     console.log(`[Main Process] 快捷键 ${toggleModelShortcut} 被按下, 通知渲染进程切换模型...`);
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`[Main Process] 快捷键 ${toggleModelShortcut} 注册失败`);
//   }

// });

// // --- App 生命周期事件处理 ---

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     globalShortcut.unregisterAll();
//     // 移除销毁隐形窗口的调用
//     // invisibleClickListenerWindow?.destroy(); 
//     app.quit();
//   }
// });

// app.on('will-quit', () => {
//   globalShortcut.unregisterAll();
//   // 移除销毁隐形窗口的调用
//   // invisibleClickListenerWindow?.destroy();
// });







// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,  // 始终在最上层
//     frame: false,       // 无边框
//     // 移除 transparent 和 hasShadow，使用默认的窗口行为
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }

// // 独立的高清截图函数
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;

//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         // !! 核心改动：确保宽高为整数 !!
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
      
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }

// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // 渲染进程请求截图
//   ipcMain.on('request-screenshot', () => {
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });




// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;
// let forceOnTopInterval: NodeJS.Timeout | null = null; // 用于强制置顶的定时器

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,  // 基础置顶
//     frame: false,       // 无边框
//     // 移除 transparent 和 hasShadow，使用默认的窗口行为以确保稳定性
//   });

//   // !! 核心：使用更高优先级的置顶 !!
//   mainWindow.setAlwaysOnTop(true, 'screen-saver');

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }

//   // !! 核心：启动一个高频定时器，持续将窗口拉到最顶层 !!
//   forceOnTopInterval = setInterval(() => {
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.moveTop(); // 强制移动到Z轴顶部
//     }
//   }, 250); // 每 250 毫秒执行一次
// }

// // 独立的高清截图函数
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }

// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // 渲染进程请求截图
//   ipcMain.on('request-screenshot', () => {
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         if (forceOnTopInterval) clearInterval(forceOnTopInterval); // 停止定时器
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     if (forceOnTopInterval) clearInterval(forceOnTopInterval); // 停止定时器
//     globalShortcut.unregisterAll();
// });






// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,      // 始终在最上层
//     frame: false,           // 无边框
//     transparent: true,      // 透明背景
//     hasShadow: false,       // 移除窗口阴影
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }

// // 独立的高清截图函数
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }


// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // IPC 通信：监听来自渲染进程的截图请求
//   ipcMain.on('request-screenshot', () => {
//     console.log('[Main Process] 收到渲染进程的截图请求...');
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`[Main Process] 快捷键 ${screenshotShortcut} 注册失败`);
//   }

//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     console.log(`[Main Process] 快捷键 ${toggleModelShortcut} 被按下, 通知渲染进程切换模型...`);
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`[Main Process] 快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });







// // electron/main.ts (最终绝对置顶且不关闭版)

// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,  // 始终在最上层
//     frame: false,       // 无边框
//     skipTaskbar: true,  // 不在任务栏显示，核心隐蔽性设置
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }

//   // !! 核心改动：当窗口失去焦点时，立刻重新获得焦点 !!
//   // 这会使窗口像“牛皮癣”一样，顽固地保持在最顶层，不会被全屏应用覆盖
//   mainWindow.on('blur', () => {
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.focus();
//     }
//   });
// }

// // 独立的高清截图函数 (保持不变)
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }


// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // 渲染进程请求截图
//   ipcMain.on('request-screenshot', () => {
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });







// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// // !! 核心改动：将截图函数定义在顶层作用域，确保稳定性 !!
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow || mainWindow.isDestroyed()) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }


// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     // --- 融合所有视觉和行为特性 ---
//     alwaysOnTop: true,      // 1. 常规模式下置顶
//     frame: false,           // 2. 无边框
//     skipTaskbar: true,      // 3. 不在任务栏显示
//     transparent: true,      // 4. !! 重新加入：透明背景 !!
//     hasShadow: false,       // 5. !! 重新加入：移除窗口阴影 !!
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }


// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // --- 智能感知全屏模式 ---
//   let lastFullscreenState = false;
//   let fullscreenCheckInterval: NodeJS.Timeout | null = null;

//   const checkFullscreen = () => {
//     if (!mainWindow || mainWindow.isDestroyed()) {
//         if(fullscreenCheckInterval) clearInterval(fullscreenCheckInterval);
//         return;
//     }
    
//     const primaryDisplay = screen.getPrimaryDisplay();
//     const { width, height } = primaryDisplay.size;
//     const workArea = primaryDisplay.workArea;
    
//     // 判断标准：当工作区的大小等于屏幕物理大小时，通常意味着有应用进入了全屏模式
//     const isFullscreen = workArea.width === width && workArea.height === height;

//     if (isFullscreen !== lastFullscreenState) {
//       lastFullscreenState = isFullscreen;
//       if (isFullscreen) {
//         // 有应用进入全屏，隐藏我们的窗口
//         mainWindow.hide();
//         console.log('[Main Process] 检测到全屏模式，客户端已自动隐藏。');
//       } else {
//         // 应用退出全屏，恢复显示我们的窗口
//         mainWindow.show();
//         console.log('[Main Process] 全屏模式已退出，客户端已自动恢复显示。');
//       }
//     }
//   };

//   // 启动定时检查
//   fullscreenCheckInterval = setInterval(checkFullscreen, 1000); // 每秒检查一次


//   // --- IPC 通信监听 ---
//   ipcMain.on('request-screenshot', () => {
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });







// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// // !! 核心改动：将截图函数定义在顶层作用域，确保稳定性 !!
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow || mainWindow.isDestroyed()) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }


// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,  // 始终在最上层
//     frame: false,       // 无边框
//     skipTaskbar: true,  // 不在任务栏显示，核心隐蔽性设置
//     transparent: true,  // 透明背景
//     hasShadow: false,   // 移除阴影
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }

//   // !! 核心：当窗口失去焦点时，立刻重新获得焦点 !!
//   // 这会使窗口像“牛皮癣”一样，顽固地保持在最顶层，不会被全屏应用覆盖
//   mainWindow.on('blur', () => {
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.focus();
//     }
//   });
// }


// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // IPC 通信：监听来自渲染进程的截图请求
//   ipcMain.on('request-screenshot', () => {
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });




// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// // ES Module 环境下 __dirname 的替代方案
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// // !! 核心改动：将截图函数定义在顶层作用域 !!
// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow || mainWindow.isDestroyed()) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }


// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,
//     frame: false,
//     skipTaskbar: true,
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/'); // 请根据 Web 前端实际端口修改
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }


// // 当 Electron App 准备就绪时
// app.whenReady().then(() => {
//   createMainWindow();

//   // IPC 通信：监听来自渲染进程的截图请求
//   ipcMain.on('request-screenshot', () => {
//     // 现在这里调用的是顶层作用域的函数，绝对不会出错
//     captureScreenshotAndSendToRenderer();
//   });

//   // --- 注册全局快捷键 ---
//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// // --- App 生命周期事件处理 ---
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });

// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });





// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow || mainWindow.isDestroyed()) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,
//     frame: false,
//     skipTaskbar: true,
//   });

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/');
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }

// app.whenReady().then(() => {
//   createMainWindow();

//   let lastFullscreenState = false;
//   let fullscreenCheckInterval: NodeJS.Timeout | null = null;
//   const checkFullscreen = () => {
//     if (!mainWindow || mainWindow.isDestroyed()) {
//         if(fullscreenCheckInterval) clearInterval(fullscreenCheckInterval);
//         return;
//     }
//     const primaryDisplay = screen.getPrimaryDisplay();
//     const { width, height } = primaryDisplay.size;
//     const workArea = primaryDisplay.workArea;
//     const isFullscreen = workArea.width === width && workArea.height === height;
//     if (isFullscreen !== lastFullscreenState) {
//       lastFullscreenState = isFullscreen;
//       if (isFullscreen) {
//         mainWindow.hide();
//         console.log('[Main Process] 检测到全屏模式，客户端已自动隐藏。');
//       } else {
//         mainWindow.show();
//         console.log('[Main Process] 全屏模式已退出，客户端已自动恢复显示。');
//       }
//     }
//   };
//   fullscreenCheckInterval = setInterval(checkFullscreen, 1000);

//   ipcMain.on('request-screenshot', captureScreenshotAndSendToRenderer);

//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });
// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });


// import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// let mainWindow: BrowserWindow | null;

// async function captureScreenshotAndSendToRenderer() {
//     if (!mainWindow || mainWindow.isDestroyed()) return;
//     try {
//       const primaryDisplay = screen.getPrimaryDisplay();
//       const { width, height } = primaryDisplay.size;
//       const scaleFactor = primaryDisplay.scaleFactor;
//       const sources = await desktopCapturer.getSources({
//         types: ['screen'],
//         thumbnailSize: {
//           width: Math.floor(width * scaleFactor),
//           height: Math.floor(height * scaleFactor),
//         }
//       });
//       const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
//       if (primaryScreen) {
//         const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
//         const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
//         console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
//         mainWindow.webContents.send('screenshot-taken', imgBase64);
//       } else { throw new Error('找不到可用的屏幕源'); }
//     } catch (error) {
//       console.error('[Main Process] 截图失败:', error);
//       mainWindow.webContents.send('screenshot-error', (error as Error).message);
//     }
// }

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     width: 500,
//     height: 750,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       nodeIntegration: true,
//       contextIsolation: false,
//     },
//     alwaysOnTop: true,
//     frame: false,
//     skipTaskbar: true,
//     // --- 修改开始 ---
//     transparent: true, // 1. 将窗口设置为透明
//     // --- 修改结束 ---
//   });

//   // 在某些系统上（特别是Windows），为了让透明窗口的阴影正确显示，
//   // 你可能需要禁用硬件加速。如果遇到显示问题可以尝试取消下面的注释。
//   // app.disableHardwareAcceleration();

//   if (process.env.VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL('http://localhost:5173/');
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
//   }
// }

// app.whenReady().then(() => {
//   createMainWindow();

//   let lastFullscreenState = false;
//   let fullscreenCheckInterval: NodeJS.Timeout | null = null;
//   const checkFullscreen = () => {
//     if (!mainWindow || mainWindow.isDestroyed()) {
//         if(fullscreenCheckInterval) clearInterval(fullscreenCheckInterval);
//         return;
//     }
//     const primaryDisplay = screen.getPrimaryDisplay();
//     const { width, height } = primaryDisplay.size;
//     const workArea = primaryDisplay.workArea;
//     const isFullscreen = workArea.width === width && workArea.height === height;
//     if (isFullscreen !== lastFullscreenState) {
//       lastFullscreenState = isFullscreen;
//       if (isFullscreen) {
//         mainWindow.hide();
//         console.log('[Main Process] 检测到全屏模式，客户端已自动隐藏。');
//       } else {
//         mainWindow.show();
//         console.log('[Main Process] 全屏模式已退出，客户端已自动恢复显示。');
//       }
//     }
//   };
//   fullscreenCheckInterval = setInterval(checkFullscreen, 1000);

//   ipcMain.on('request-screenshot', captureScreenshotAndSendToRenderer);

//   const screenshotShortcut = 'Ctrl+Alt+S';
//   if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
//     console.log(`快捷键 ${screenshotShortcut} 注册失败`);
//   }
//   const toggleModelShortcut = 'Alt+Z';
//   if (!globalShortcut.register(toggleModelShortcut, () => {
//     mainWindow?.webContents.send('toggle-model');
//   })) {
//     console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
//   }
// });

// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         globalShortcut.unregisterAll();
//         app.quit();
//     }
// });
// app.on('will-quit', () => {
//     globalShortcut.unregisterAll();
// });








import { app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// --- ↓↓↓ 1. 从你的新服务文件中导入核心函数 ↓↓↓ ---
import { callGeminiWithFallback } from './geminiApiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is necessary for Vite's HMR to work in development
process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null;

async function captureScreenshotAndSendToRenderer() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const scaleFactor = primaryDisplay.scaleFactor;
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.floor(width * scaleFactor),
          height: Math.floor(height * scaleFactor),
        }
      });
      const primaryScreen = sources.find(source => source.name === 'Entire screen' || source.name === 'Screen 1') || sources[0];
      if (primaryScreen) {
        const screenshotDataURL = await primaryScreen.thumbnail.toDataURL();
        const imgBase64 = screenshotDataURL.replace(/^data:image\/png;base64,/, '');
        console.log(`[Main Process] 高清截图成功, 发送给渲染进程...`);
        mainWindow.webContents.send('screenshot-taken', imgBase64);
      } else { throw new Error('找不到可用的屏幕源'); }
    } catch (error) {
      console.error('[Main Process] 截图失败:', error);
      mainWindow.webContents.send('screenshot-error', (error as Error).message);
    }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false, // 注意：为了简单起见保持false，但官方推荐true + contextBridge
    },
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    transparent: true,
  });

  // app.disableHardwareAcceleration(); // 如果透明窗口有问题，取消此行注释

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // Vite builds the renderer to the `dist` directory
    mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  // 全屏检测逻辑 (保持不变)
  let lastFullscreenState = false;
  let fullscreenCheckInterval: NodeJS.Timeout | null = null;
  const checkFullscreen = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        if(fullscreenCheckInterval) clearInterval(fullscreenCheckInterval);
        return;
    }
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const workArea = primaryDisplay.workArea;
    const isFullscreen = workArea.width === width && workArea.height === height;
    if (isFullscreen !== lastFullscreenState) {
      lastFullscreenState = isFullscreen;
      if (isFullscreen) {
        mainWindow.hide();
        console.log('[Main Process] 检测到全屏模式，客户端已自动隐藏。');
      } else {
        mainWindow.show();
        console.log('[Main Process] 全屏模式已退出，客户端已自动恢复显示。');
      }
    }
  };
  fullscreenCheckInterval = setInterval(checkFullscreen, 1000);

  // --- ↓↓↓ 2. 添加新的 IPC 监听器来处理 AI 请求 ↓↓↓ ---
  // 使用 ipcMain.handle, 这是一个异步的、可以返回值给渲染进程的监听器
  ipcMain.handle('ask-ai', async (event, { promptText, imageBase64 }: { promptText: string, imageBase64: string }) => {
    console.log(`[Main Process] 收到AI请求: "${promptText}"`);
    try {
      // 调用我们强大的、带回退逻辑的核心函数
      // 注意：这里我们假设 geminiApiService.ts 内部处理了多模态的请求格式
      const result = await callGeminiWithFallback(promptText, imageBase64);
      
      // 解析成功的结果并返回给渲染进程
      // Gemini Pro Vision 的响应结构可能略有不同，请根据实际情况调整
      const textResponse = result.candidates[0].content.parts[0].text;
      return { success: true, data: textResponse };

    } catch (error: any) {
      // 如果所有密钥都失败了，这里的 catch 会捕获最终错误
      console.error("[Main Process] AI 请求最终失败:", error.message);
      // 将错误信息包装后返回给渲染进程
      return { success: false, error: error.message };
    }
  });


  // 现有 IPC 监听器 (保持不变)
  ipcMain.on('request-screenshot', captureScreenshotAndSendToRenderer);


  // 全局快捷键 (保持不变)
  const screenshotShortcut = 'Shift+Z';
  if (!globalShortcut.register(screenshotShortcut, captureScreenshotAndSendToRenderer)) {
    console.log(`快捷键 ${screenshotShortcut} 注册失败`);
  }
  const toggleModelShortcut = 'Alt+Z';
  if (!globalShortcut.register(toggleModelShortcut, () => {
    mainWindow?.webContents.send('toggle-model');
  })) {
    console.log(`快捷键 ${toggleModelShortcut} 注册失败`);
  }
});


// 应用生命周期事件 (保持不变)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        globalShortcut.unregisterAll();
        app.quit();
    }
});
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});