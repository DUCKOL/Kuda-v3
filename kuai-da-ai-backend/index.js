// // =================================================================
// // 快答AI - 智能笔试辅助系统 (后端服务)
// // 文件: index.js (最终图片处理版)
// // =================================================================

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');
// require('dotenv').config();

// // --- 初始化 ---
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' })); // 提高请求体大小限制以容纳截图数据
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });
// const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

// // --- API 路由 (保持不变) ---
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
//     res.status(201).json({ message: '用户注册成功', userId: newUser.id });
//   } catch (error) {
//     console.error('注册失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//     res.json({ message: '登录成功', token: token, userId: user.id });
//   } catch (error) {
//     console.error('登录失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// // --- WebSocket 逻辑 ---
// io.on('connection', (socket) => {
//   console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
//   socket.on('authenticate', (token) => {
//     if (!token) return socket.disconnect();
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const userId = decoded.userId;
//       socket.join(userId);
//       console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${userId}`);
//       socket.emit('authenticated');
//     } catch (error) {
//       console.log(`[Socket.IO] 认证失败: ${error.message}`);
//       socket.disconnect();
//     }
//   });
  
//   // ## 核心修改：恢复对 image 字段的正确处理 ##
//   socket.on('submitQuestion', async (data) => {
//     const { userId, image, prompt, model } = data;
    
//     // 我们现在只关心图片问题
//     if (image) {
//       console.log(`[Socket.IO] 收到来自用户 ${userId} 的【图片】问题, 使用模型: ${model}`);
//     } else {
//       console.log(`[Socket.IO] 警告: 收到一个不包含图片的问题请求。`);
//       return; // 如果没有图片，直接忽略
//     }

//     try {
//       const answer = await callGeminiAPI({ base64Image: image, prompt, model });
//       io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
//     } catch (error) {
//       console.error("[Gemini] AI 处理流程最终失败:", error.message);
//       io.to(userId).emit('error', { message: 'AI处理失败，请检查API密钥或全局代理设置。' });
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log(`[Socket.IO] 客户端已断开: ${socket.id}`);
//   });
// });

// // --- Gemini API 调用函数 (只处理图片) ---
// async function callGeminiAPI({ base64Image, prompt, model }) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env file');
  
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
//   // 构建包含图片数据的请求体
//   const requestBody = {
//     "contents": [{
//       "parts": [
//         { "text": prompt },
//         { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }
//       ]
//     }]
//   };
  
//   try {
//     console.log(`[Gemini] 正在向模型 [${model}] 发起【图片】请求 (依赖系统级代理)...`);
    
//     const response = await axios.post(url, requestBody, {
//       headers: { 'Content-Type': 'application/json' },
//     });

//     if (response.data.candidates && response.data.candidates.length > 0) {
//       const answer = response.data.candidates[0].content.parts[0].text;
//       console.log("[Gemini] 成功获取到回答。");
//       return answer;
//     } else {
//       console.warn("[Gemini] API 返回了空的 candidates 列表。");
//       console.log("[Gemini] 完整响应:", JSON.stringify(response.data, null, 2));
//       return "AI模型返回了空结果，可能是触发了安全限制。";
//     }
//   } catch (error) {
//     console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
//     console.error("[Gemini] API 调用时捕获到致命错误!");
//     if (error.response) {
//       console.error("[Gemini] 响应状态码:", error.response.status);
//       console.error("[Gemini] 完整的响应体 (Response Body):", JSON.stringify(error.response.data, null, 2));
//       throw new Error(`Google API returned an error: ${error.response.status}`);
//     } else {
//       console.error("[Gemini] 网络或未知错误:", error.message);
//       throw new Error(error.message);
//     }
//   }
// }

// // --- 启动服务器 ---
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
//   console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
// });








// // =================================================================
// // 快答AI - 智能笔试辅助系统 (后端服务)
// // 文件: index.js (最终绝对防崩溃版)
// // =================================================================

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');
// require('dotenv').config();

// // !! 核心：添加全局异常捕获，防止程序因任何意外错误而崩溃 !!
// process.on('uncaughtException', (error, origin) => {
//   console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
//   console.error('FATAL: 捕获到未处理的异常 (Uncaught Exception):', error);
//   console.error('FATAL: 异常来源:', origin);
//   console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
// });
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
//   console.error('FATAL: 捕获到未处理的 Promise Rejection:', reason);
//   console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
// });


// // --- 初始化 ---
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   pingInterval: 30000,
//   pingTimeout: 15000,
// });
// const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

// // --- API 路由 ---
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
//     res.status(201).json({ message: '用户注册成功', userId: newUser.id });
//   } catch (error) {
//     console.error('注册失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//     res.json({ message: '登录成功', token: token, userId: user.id });
//   } catch (error) {
//     console.error('登录失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// // --- WebSocket 逻辑 ---
// io.on('connection', (socket) => {
//   console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
//   socket.on('authenticate', (token) => {
//     if (!token) return socket.disconnect();
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const userId = decoded.userId;
//       socket.join(userId);
//       console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${userId}`);
//       socket.emit('authenticated');
//     } catch (error) {
//       console.log(`[Socket.IO] 认证失败: ${error.message}`);
//       socket.disconnect();
//     }
//   });
  
//   socket.on('submitQuestion', async (data) => {
//     const { userId, image, prompt, model } = data;
//     if (!image) {
//       console.log(`[Socket.IO] 警告: 收到一个不包含图片的问题请求。`);
//       return;
//     }
//     console.log(`[Socket.IO] 收到来自用户 ${userId} 的【图片】问题, 使用模型: ${model}`);
//     try {
//       const answer = await callGeminiAPI({ base64Image: image, prompt, model });
//       io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
//     } catch (error) {
//       console.error("[Gemini] AI 处理流程最终失败:", error.message);
//       io.to(userId).emit('error', { message: 'AI处理失败，请检查API密钥或网络代理。' });
//     }
//   });

//   socket.on('disconnect', (reason) => {
//     console.log(`[Socket.IO] 客户端已断开: ${socket.id}, 原因: ${reason}`);
//   });
// });

// // --- Gemini API 调用函数 ---
// async function callGeminiAPI({ base64Image, prompt, model }) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     throw new Error('GEMINI_API_KEY is not set in .env file');
//   }
  
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
//   const requestBody = {
//     "contents": [{
//       "parts": [
//         { "text": prompt },
//         { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }
//       ]
//     }]
//   };
  
//   try {
//     console.log(`[Gemini] 正在向模型 [${model}] 发起【图片】请求 (依赖系统级代理)...`);
    
//     const response = await axios.post(url, requestBody, {
//       headers: { 'Content-Type': 'application/json' },
//       timeout: 30000 // 设置30秒的请求超时
//     });

//     if (response.data.candidates && response.data.candidates.length > 0) {
//       const answer = response.data.candidates[0].content.parts[0].text;
//       console.log("[Gemini] 成功获取到回答。");
//       return answer;
//     } else {
//       console.warn("[Gemini] API 返回了空的 candidates 列表。可能是内容安全问题。");
//       console.log("[Gemini] 完整响应:", JSON.stringify(response.data, null, 2));
//       return "AI模型返回了空结果，可能是图片内容触发了安全限制。";
//     }
//   } catch (error) {
//     console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
//     console.error("[Gemini] API 调用时捕获到致命错误!");
//     if (error.response) {
//       console.error("[Gemini] 响应状态码:", error.response.status);
//       console.error("[Gemini] 完整的响应体 (Response Body):", JSON.stringify(error.response.data, null, 2));
//       throw new Error(`Google API returned an error: ${error.response.status}`);
//     } else if (error.request) {
//         console.error("[Gemini] 网络错误: 请求已发出但没有收到响应。");
//         console.error("[Gemini] 错误信息:", error.message);
//         throw new Error('Network error, no response received from Gemini API.');
//     } else {
//       console.error("[Gemini] 发生未知错误:", error.message);
//       throw new Error('An unknown error occurred while calling Gemini API.');
//     }
//   }
// }

// // --- 启动服务器 ---
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
//   console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
// });













// // =================================================================
// // 快答AI - 智能笔试辅助系统 (后端服务)
// // 文件: index.js (最终密钥轮换版)
// // =================================================================

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');
// require('dotenv').config();

// // 全局异常捕获，防止程序因任何意外错误而崩溃
// process.on('uncaughtException', (error, origin) => { console.error('FATAL: 捕获到未处理的异常:', error, origin); });
// process.on('unhandledRejection', (reason, promise) => { console.error('FATAL: 捕获到未处理的 Promise Rejection:', reason); });

// // --- 1. API 密钥管理器 ---
// const apiKeyManager = {
//   geminiKeys: [],
//   currentGeminiKeyIndex: 0,
//   initialize: function() {
//     const keys = process.env.GEMINI_API_KEY || "";
//     this.geminiKeys = keys.split(',').filter(k => k.trim() !== '');
//     if (this.geminiKeys.length > 0) {
//       console.log(`[Key Manager] 初始化完成, 加载了 ${this.geminiKeys.length} 个 Gemini 密钥。`);
//     } else {
//       console.warn(`[Key Manager] 警告: 未在 .env 文件中找到任何有效的 Gemini API 密钥。`);
//     }
//   },
//   getCurrentGeminiKey: function() {
//     if (this.geminiKeys.length === 0) return null;
//     return this.geminiKeys[this.currentGeminiKeyIndex];
//   },
//   rotateGeminiKey: function() {
//     if (this.geminiKeys.length === 0) return false;
//     this.currentGeminiKeyIndex = (this.currentGeminiKeyIndex + 1) % this.geminiKeys.length;
//     console.log(`[Key Manager] Gemini 密钥已轮换到索引: ${this.currentGeminiKeyIndex}`);
//     return true;
//   }
// };
// apiKeyManager.initialize(); // 启动时立即初始化

// // --- 2. 初始化服务 ---
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   pingInterval: 30000,
//   pingTimeout: 20000,
//   maxHttpBufferSize: 20 * 1024 * 1024
// });
// const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

// // --- 3. API 路由 ---
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
//     res.status(201).json({ message: '用户注册成功', userId: newUser.id });
//   } catch (error) {
//     console.error('注册失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//     res.json({ message: '登录成功', token: token, userId: user.id });
//   } catch (error) {
//     console.error('登录失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// // --- 4. WebSocket 逻辑 ---
// io.on('connection', (socket) => {
//   console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
//   socket.on('authenticate', (token) => {
//     if (!token) return socket.disconnect();
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const userId = decoded.userId;
//       socket.join(userId);
//       console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${userId}`);
//       socket.emit('authenticated');
//     } catch (error) {
//       console.log(`[Socket.IO] 认证失败: ${error.message}`);
//       socket.disconnect();
//     }
//   });
  
//   socket.on('submitQuestion', async (data) => {
//     const { userId, image, prompt, model } = data;
//     if (!image) return;
//     try {
//       const answer = await callAIModel({ base64Image: image, prompt, model });
//       io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
//     } catch (error) {
//       console.error("[AI Center] AI 处理流程最终失败:", error.message);
//       io.to(userId).emit('error', { message: `AI处理失败: ${error.message}` });
//     }
//   });

//   socket.on('disconnect', (reason) => {
//     console.log(`[Socket.IO] 客户端已断开: ${socket.id}, 原因: ${reason}`);
//   });
// });

// // --- 5. AI 模型调用中心 ---
// async function callAIModel({ base64Image, prompt, model }, retryCount = 0) {
//   // Gemini 模型
//   if (model.startsWith('gemini-')) {
//     const currentApiKey = apiKeyManager.getCurrentGeminiKey();
//     if (!currentApiKey) throw new Error('没有可用的 Gemini API 密钥');
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey}`;
//     const requestBody = { "contents": [{ "parts": [{ "text": prompt }, { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }] }] };
//     try {
//       console.log(`[Gemini] 正在向模型 [${model}] 发起请求 (使用密钥索引: ${apiKeyManager.currentGeminiKeyIndex})...`);
//       const response = await axios.post(url, requestBody, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
//       if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
//         return response.data.candidates[0].content.parts[0].text;
//       }
//       throw new Error('Gemini API 返回了空的结果。');
//     } catch (error) {
//       const errorMessage = error.response?.data?.error?.message || error.message;
//       console.error(`[Gemini] API 调用失败 (密钥索引 ${apiKeyManager.currentGeminiKeyIndex}):`, errorMessage);
//       if (error.response && error.response.status === 429) {
//         console.warn(`[Key Manager] 密钥索引 ${apiKeyManager.currentGeminiKeyIndex} 额度耗尽。`);
//         if (retryCount >= apiKeyManager.geminiKeys.length - 1) {
//           console.error("[Key Manager] 所有 Gemini 密钥均已额度耗尽，停止重试。");
//           throw new Error('所有 Gemini 密钥均已额度耗尽。');
//         }
//         apiKeyManager.rotateGeminiKey();
//         await new Promise(resolve => setTimeout(resolve, 500));
//         console.log("[Key Manager] 正在使用下一个密钥自动重试...");
//         return callAIModel({ base64Image, prompt, model }, retryCount + 1);
//       }
//       throw new Error(`Gemini API 请求失败: ${errorMessage}`);
//     }
//   }

//   // 其他模型的调用逻辑...
//   // (此处省略 DeepSeek, OpenAI, Claude, SiliconFlow 的代码块以保持简洁，
//   // 它们与之前的版本相同，您可以从之前的回复中复制过来)

//   // 如果所有 if 都不匹配
//   throw new Error(`不支持的模型: ${model}`);
// }

// // --- 6. 启动服务器 ---
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
//   console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
// });









// // =================================================================
// // 文件: index.js (最终密钥轮换+防崩溃+系统代理版)
// // =================================================================

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');
// require('dotenv').config();

// // 全局异常捕获，防止程序因任何意外错误而崩溃
// process.on('uncaughtException', (error, origin) => { console.error('FATAL: 捕获到未处理的异常:', error, origin); });
// process.on('unhandledRejection', (reason, promise) => { console.error('FATAL: 捕获到未处理的 Promise Rejection:', reason); });

// // --- 1. API 密钥管理器 ---
// const apiKeyManager = {
//   geminiKeys: [],
//   currentGeminiKeyIndex: 0,
//   initialize: function() {
//     const keys = process.env.GEMINI_API_KEY || "";
//     this.geminiKeys = keys.split(',').filter(k => k.trim() !== '');
//     if (this.geminiKeys.length > 0) {
//       console.log(`[Key Manager] 初始化完成, 加载了 ${this.geminiKeys.length} 个 Gemini 密钥。`);
//     } else {
//       console.warn(`[Key Manager] 警告: 未在 .env 文件中找到任何有效的 Gemini API 密钥。`);
//     }
//   },
//   getCurrentGeminiKey: function() {
//     if (this.geminiKeys.length === 0) return null;
//     return this.geminiKeys[this.currentGeminiKeyIndex];
//   },
//   rotateGeminiKey: function() {
//     if (this.geminiKeys.length === 0) return false;
//     this.currentGeminiKeyIndex = (this.currentGeminiKeyIndex + 1) % this.geminiKeys.length;
//     console.log(`[Key Manager] Gemini 密钥已轮换到索引: ${this.currentGeminiKeyIndex}`);
//     return true;
//   }
// };
// apiKeyManager.initialize();

// // --- 2. 初始化服务 ---
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   pingInterval: 30000,
//   pingTimeout: 20000,
//   maxHttpBufferSize: 20 * 1024 * 1024
// });
// const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

// // --- 3. API 路由 ---
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
//     res.status(201).json({ message: '用户注册成功', userId: newUser.id });
//   } catch (error) {
//     console.error('注册失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//     res.json({ message: '登录成功', token: token, userId: user.id });
//   } catch (error) {
//     console.error('登录失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// // --- 4. WebSocket 逻辑 ---
// io.on('connection', (socket) => {
//   console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
//   socket.on('authenticate', (token) => {
//     if (!token) return socket.disconnect();
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const userId = decoded.userId;
//       socket.join(userId);
//       console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${userId}`);
//       socket.emit('authenticated');
//     } catch (error) {
//       console.log(`[Socket.IO] 认证失败: ${error.message}`);
//       socket.disconnect();
//     }
//   });
  
//   socket.on('submitQuestion', async (data) => {
//     const { userId, image, prompt, model } = data;
//     if (!image) return;
//     try {
//       const answer = await callAIModel({ base64Image: image, prompt, model });
//       io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
//     } catch (error) {
//       console.error("[AI Center] AI 处理流程最终失败:", error.message);
//       io.to(userId).emit('error', { message: `AI处理失败: ${error.message}` });
//     }
//   });

//   socket.on('disconnect', (reason) => {
//     console.log(`[Socket.IO] 客户端已断开: ${socket.id}, 原因: ${reason}`);
//   });
// });

// // --- 5. AI 模型调用中心 ---
// async function callAIModel({ base64Image, prompt, model }, retryCount = 0) {
//   // Gemini 模型
//   if (model.startsWith('gemini-')) {
//     const currentApiKey = apiKeyManager.getCurrentGeminiKey();
//     if (!currentApiKey) throw new Error('没有可用的 Gemini API 密钥');
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey}`;
//     const requestBody = { "contents": [{ "parts": [{ "text": prompt }, { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }] }] };
//     try {
//       console.log(`[Gemini] 正在向模型 [${model}] 发起请求 (使用密钥索引: ${apiKeyManager.currentGeminiKeyIndex})...`);
//       // !! 核心：这是一个不包含任何内置代理的、干净的 axios 请求 !!
//       const response = await axios.post(url, requestBody, { 
//           headers: { 'Content-Type': 'application/json' }, 
//           timeout: 60000 // 60秒超时
//       });
//       if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
//         return response.data.candidates[0].content.parts[0].text;
//       }
//       throw new Error('Gemini API 返回了空的结果。');
//     } catch (error) {
//       const errorMessage = error.response?.data?.error?.message || error.message;
//       console.error(`[Gemini] API 调用失败 (密钥索引 ${apiKeyManager.currentGeminiKeyIndex}):`, errorMessage);
//       if (error.response && error.response.status === 429) {
//         console.warn(`[Key Manager] 密钥索引 ${apiKeyManager.currentGeminiKeyIndex} 额度耗尽。`);
//         if (retryCount >= apiKeyManager.geminiKeys.length - 1) {
//           console.error("[Key Manager] 所有 Gemini 密钥均已额度耗尽，停止重试。");
//           throw new Error('所有 Gemini 密钥均已额度耗尽。');
//         }
//         apiKeyManager.rotateGeminiKey();
//         await new Promise(resolve => setTimeout(resolve, 500));
//         console.log("[Key Manager] 正在使用下一个密钥自动重试...");
//         return callAIModel({ base64Image, prompt, model }, retryCount + 1);
//       }
//       throw new Error(`Gemini API 请求失败: ${errorMessage}`);
//     }
//   }

//   // 其他模型的调用逻辑...
//   // (您可以从之前的回复中，将 DeepSeek, OpenAI, Claude, SiliconFlow 的代码块粘贴到这里)

//   // 如果所有 if 都不匹配
//   throw new Error(`不支持的模型: ${model}`);
// }

// // --- 6. 启动服务器 ---
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
//   console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
// });







// // =================================================================
// // 快答AI - 智能笔试辅助系统 (后端服务)
// // 文件: index.js (最终 SOCKS DNS 代理版)
// // =================================================================

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const bcrypt =require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');
// const { SocksProxyAgent } = require('socks-proxy-agent'); // 引入 SOCKS 代理库
// require('dotenv').config();

// // 全局异常捕获，防止程序因任何意外错误而崩溃
// process.on('uncaughtException', (error, origin) => { console.error('FATAL: 捕获到未处理的异常:', error, origin); });
// process.on('unhandledRejection', (reason, promise) => { console.error('FATAL: 捕获到未处理的 Promise Rejection:', reason); });

// // --- 初始化 ---
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   },
//   // !! 核心改动：调整心跳配置，使其更宽松 !!
//   pingInterval: 30000, // 服务器每 30 秒发送一次 ping
//   pingTimeout: 20000,  // 如果 20 秒内没有收到 pong，则认为连接断开 (给足传输时间)
//   maxHttpBufferSize: 20 * 1024 * 1024 // 20MB
// });
// const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';

// // --- API 路由 ---
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
//     res.status(201).json({ message: '用户注册成功', userId: newUser.id });
//   } catch (error) {
//     console.error('注册失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//     res.json({ message: '登录成功', token: token, userId: user.id });
//   } catch (error) {
//     console.error('登录失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// // --- WebSocket 逻辑 ---
// io.on('connection', (socket) => {
//   console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
//   socket.on('authenticate', (token) => {
//     if (!token) return socket.disconnect();
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const userId = decoded.userId;
//       socket.join(userId);
//       console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${userId}`);
//       socket.emit('authenticated');
//     } catch (error) {
//       console.log(`[Socket.IO] 认证失败: ${error.message}`);
//       socket.disconnect();
//     }
//   });
  
//   socket.on('submitQuestion', async (data) => {
//     const { userId, image, prompt, model } = data;
//     if (!image) return;
//     try {
//       const answer = await callAIModel({ base64Image: image, prompt, model });
//       io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
//     } catch (error) {
//       console.error("[AI Center] AI 处理流程最终失败:", error.message);
//       io.to(userId).emit('error', { message: 'AI处理失败，请检查模型支持、API密钥或网络代理。' });
//     }
//   });

//   socket.on('disconnect', (reason) => {
//     console.log(`[Socket.IO] 客户端已断开: ${socket.id}, 原因: ${reason}`);
//   });
// });

// // --- 5. AI 模型调用中心 ---
// async function callAIModel({ base64Image, prompt, model }) {
//   // !! 核心配置：使用 socks5h 协议，让代理服务器处理 DNS 解析 !!
//   const socksPort = 10808; // !! 请确保这是您代理软件的 SOCKS5 端口 !!
//   const proxyAgent = new SocksProxyAgent(`socks5h://127.0.0.1:${socksPort}`);
  
//   const axiosConfig = {
//     headers: { 'Content-Type': 'application/json' },
//     httpsAgent: proxyAgent,
//     httpAgent: proxyAgent,
//     timeout: 30000 // 增加超时时间到 30 秒
//   };

//   console.log(`[AI Center] 准备调用模型: ${model}`);

//   // 1. Gemini 模型
//   if (model.startsWith('gemini-')) {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) throw new Error('GEMINI_API_KEY 未设置');
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
//     const requestBody = { "contents": [{ "parts": [{ "text": prompt }, { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }] }] };
//     try {
//       console.log(`[Gemini] 正在向模型 [${model}] 发起请求 (通过SOCKS5 DNS代理)...`);
//       const response = await axios.post(url, requestBody, axiosConfig);
//       if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) { return response.data.candidates[0].content.parts[0].text; }
//       throw new Error('Gemini API 返回了空的结果。');
//     } catch (error) {
//       console.error("[Gemini] API 调用失败:", error.response?.data || error.message);
//       throw new Error('Gemini API 请求失败。');
//     }
//   }

//   // 2. DeepSeek 模型
//   if (model.startsWith('deepseek-')) {
//     const apiKey = process.env.DEEPSEEK_API_KEY;
//     if (!apiKey) throw new Error('DEEPSEEK_API_KEY 未设置');
//     const url = 'https://api.deepseek.com/v1/chat/completions';
//     const requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }] }] };
//     try {
//       console.log(`[DeepSeek] 正在向模型 [${model}] 发起请求 (通过SOCKS5 DNS代理)...`);
//       const response = await axios.post(url, requestBody, { ...axiosConfig, headers: { ...axiosConfig.headers, 'Authorization': `Bearer ${apiKey}` } });
//       if (response.data.choices?.[0]?.message?.content) { return response.data.choices[0].message.content; }
//       throw new Error('DeepSeek API 返回了空的结果。');
//     } catch (error) {
//       console.error("[DeepSeek] API 调用失败:", error.response?.data || error.message);
//       throw new Error('DeepSeek API 请求失败。');
//     }
//   }

//   // 3. GPT 模型 (OpenAI)
//   if (model.startsWith('gpt-')) {
//     const apiKey = process.env.OPENAI_API_KEY;
//     if (!apiKey) throw new Error('OPENAI_API_KEY 未设置');
//     const url = 'https://api.openai.com/v1/chat/completions';
//     const requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}`, "detail": "high" } }] }], "max_tokens": 2000 };
//     try {
//       console.log(`[OpenAI] 正在向模型 [${model}] 发起请求 (通过SOCKS5 DNS代理)...`);
//       const response = await axios.post(url, requestBody, { ...axiosConfig, headers: { ...axiosConfig.headers, 'Authorization': `Bearer ${apiKey}` } });
//       if (response.data.choices?.[0]?.message?.content) { return response.data.choices[0].message.content; }
//       throw new Error('OpenAI API 返回了空的结果。');
//     } catch (error) {
//       console.error("[OpenAI] API 调用失败:", error.response?.data || error.message);
//       throw new Error('OpenAI API 请求失败。');
//     }
//   }

//   // 4. Claude 模型
//   if (model.startsWith('claude-')) {
//     const apiKey = process.env.CLAUDE_API_KEY;
//     if (!apiKey) throw new Error('CLAUDE_API_KEY 未设置');
//     const url = 'https://api.anthropic.com/v1/messages';
//     const requestBody = { "model": model, "max_tokens": 2000, "messages": [{ "role": "user", "content": [{ "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": base64Image } }, { "type": "text", "text": prompt }] }] };
//     try {
//       console.log(`[Claude] 正在向模型 [${model}] 发起请求 (通过SOCKS5 DNS代理)...`);
//       const response = await axios.post(url, requestBody, { ...axiosConfig, headers: { ...axiosConfig.headers, 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } });
//       if (response.data.content?.[0]?.text) { return response.data.content[0].text; }
//       throw new Error('Claude API 返回了空的结果。');
//     } catch (error) {
//       console.error("[Claude] API 调用失败:", error.response?.data || error.message);
//       throw new Error('Claude API 请求失败。');
//     }
//   }

//   // 5. 硅基流动 (SiliconFlow) 模型
//   const knownPrefixes = ['gemini-', 'deepseek-', 'gpt-', 'claude-'];
//   if (!knownPrefixes.some(prefix => model.startsWith(prefix))) {
//     const apiKey = process.env.SILICONFLOW_API_KEY;
//     if (!apiKey) throw new Error('SILICONFLOW_API_KEY 未设置');
//     const url = 'https://api.siliconflow.cn/v1/chat/completions';
//     const requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }] }], "max_tokens": 2000 };
//     try {
//       console.log(`[SiliconFlow] 正在向模型 [${model}] 发起请求 (通过SOCKS5 DNS代理)...`);
//       const response = await axios.post(url, requestBody, { ...axiosConfig, headers: { ...axiosConfig.headers, 'Authorization': `Bearer ${apiKey}` } });
//       if (response.data.choices?.[0]?.message?.content) { return response.data.choices[0].message.content; }
//       throw new Error('SiliconFlow API 返回了空的结果。');
//     } catch (error) {
//       console.error("[SiliconFlow] API 调用失败:", error.response?.data || error.message);
//       throw new Error('SiliconFlow API 请求失败。');
//     }
//   }

//   // 所有模型都未匹配
//   throw new Error(`不支持的模型或未知的模型前缀: ${model}`);
// }

// // --- 启动服务器 ---
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
//   console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
// });




// // =================================================================
// // 快答AI - 智能笔试辅助系统 (后端服务)
// // 文件: index.js (最终版 - 修复密钥切换逻辑并增强诊断日志)
// // =================================================================

// const express = require('express');
// const http = require('http');
// const { Server } = require("socket.io");
// const cors = require('cors');
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');
// const { SocksProxyAgent } = require('socks-proxy-agent');
// require('dotenv').config({ override: true });
// // --- START: 添加诊断代码 ---
// console.log('============================================================');
// console.log('本地读取，不会泄露您的隐私！');
// console.log('[YSUNKD] 读取到的原始 GEMINI_API_KEY 是:', process.env.GEMINI_API_KEY);
// console.log('[YSUNKD] 读取到的原始 DEEPSEEK_API_KEY 是:', process.env.DEEPSEEK_API_KEY);
// console.log('[YSUNKD] 读取到的原始 OPENAI_API_KEY 是:', process.env.OPENAI_API_KEY);
// console.log('[YSUNKD] 读取到的原始 CLAUDE_API_KEY 是:', process.env.CLAUDE_API_KEY);
// console.log('[YSUNKD] 读取到的原始 GEMINI_API_KEY 是:', process.env.GEMINI_API_KEY);
// console.log('[YSUNKD] 读取到的原始 SILICONFLOW_API_KEY 是:', process.env.SILICONFLOW_API_KEY);
// console.log('============================================================');
// console.log(`
//   *   *   *****   *     *   *     *   *    *   ****** 
//   *   *  *     *  *     *   **    *   *   *    *     *
//    * *   *        *     *   * *   *   *  *     *     *
//     *     *****   *     *   *  *  *   ***      *     *
//     *          *  *     *   *   * *   *  *     *     *
//     *    *     *  *     *   *    **   *   *    *     *
//     *     *****    *****    *     *   *    *   ****** 
//   `);
// console.log('============================================================');
// // 全局异常捕获
// process.on('uncaughtException', (error, origin) => { console.error('FATAL: 捕获到未处理的异常:', error, origin); });
// process.on('unhandledRejection', (reason, promise) => { console.error('FATAL: 捕获到未处理的 Promise Rejection:', reason); });


// // =================================================================
// // 1. API 密钥管理器
// // =================================================================
// class ApiKeyManager {
//   constructor() {
//     this.keys = {};
//     this.currentIndex = {}; // 用于记录下一次请求应该从哪个索引开始
//     this.loadKey('GEMINI', process.env.GEMINI_API_KEY);
//     this.loadKey('DEEPSEEK', process.env.DEEPSEEK_API_KEY);
//     this.loadKey('OPENAI', process.env.OPENAI_API_KEY);
//     this.loadKey('CLAUDE', process.env.CLAUDE_API_KEY);
//     this.loadKey('SILICONFLOW', process.env.SILICONFLOW_API_KEY);
//   }

//   loadKey(serviceName, keysString) {
//     if (keysString && keysString.trim()) {
//       // 过滤掉任何可能存在的空字符串
//       this.keys[serviceName] = keysString.split(',').map(k => k.trim()).filter(Boolean);
//       this.currentIndex[serviceName] = 0;
//       if (this.keys[serviceName].length > 0) {
//         console.log(`[ApiKeyManager] 成功加载 ${this.keys[serviceName].length} 个 ${serviceName} 密钥。`);
//       } else {
//         console.warn(`[ApiKeyManager] 警告: ${serviceName}_API_KEY 环境变量已设置，但未找到有效的密钥。`);
//       }
//     } else {
//       console.warn(`[ApiKeyManager] 警告: 未找到服务 ${serviceName} 的 API 密钥配置。`);
//       this.keys[serviceName] = [];
//     }
//   }

//   // 成功后，更新下一个请求的起始索引，实现负载均衡
//   setNextKeyIndex(serviceName, currentSuccessIndex) {
//     const keyRing = this.keys[serviceName];
//     if (!keyRing || keyRing.length === 0) return;
//     this.currentIndex[serviceName] = (currentSuccessIndex + 1) % keyRing.length;
//   }
// }


// // =================================================================
// // 2. 初始化
// // =================================================================
// const apiKeyManager = new ApiKeyManager();
// const prisma = new PrismaClient();
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   pingInterval: 30000,
//   pingTimeout: 20000,
//   maxHttpBufferSize: 20 * 1024 * 1024
// });
// const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';


// // =================================================================
// // 3. API 路由 (用户认证)
// // =================================================================
// // ... (注册和登录部分代码保持不变, 为简洁此处省略)
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
//     res.status(201).json({ message: '用户注册成功', userId: newUser.id });
//   } catch (error) {
//     console.error('注册失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
//     res.json({ message: '登录成功', token: token, userId: user.id });
//   } catch (error) {
//     console.error('登录失败:', error);
//     res.status(500).json({ message: '服务器内部错误' });
//   }
// });

// // =================================================================
// // 4. WebSocket 逻辑
// // =================================================================
// // ... (WebSocket部分代码保持不变, 为简洁此处省略)
// io.on('connection', (socket) => {
//   console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
//   socket.on('authenticate', (token) => {
//     if (!token) return socket.disconnect();
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       socket.join(decoded.userId);
//       console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${decoded.userId}`);
//       socket.emit('authenticated');
//     } catch (error) {
//       console.log(`[Socket.IO] 认证失败: ${error.message}`);
//       socket.disconnect();
//     }
//   });

//   socket.on('submitQuestion', async (data) => {
//     const { userId, image, prompt, model } = data;
//     if (!image) return;
//     try {
//       const answer = await callAIModel({ base64Image: image, prompt, model });
//       io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
//     } catch (error) {
//       console.error("[AI Center] AI 处理流程最终失败:", error.message);
//       io.to(userId).emit('error', { message: `AI处理失败: ${error.message}` });
//     }
//   });

//   socket.on('disconnect', (reason) => {
//     console.log(`[Socket.IO] 客户端已断开: ${socket.id}, 原因: ${reason}`);
//   });
// });

// // =================================================================
// // 5. AI 模型调用中心 (最终版)
// // =================================================================
// async function callAIModel({ base64Image, prompt, model }) {
//   const socksPort = 10808;
//   const proxyAgent = new SocksProxyAgent(`socks5h://127.0.0.1:${socksPort}`);
//   const baseAxiosConfig = {
//     headers: { 'Content-Type': 'application/json' },
//     httpsAgent: proxyAgent,
//     httpAgent: proxyAgent,
//     timeout: 30000
//   };

//   let serviceName = '';
//   const knownPrefixes = ['gemini-', 'deepseek-', 'gpt-', 'claude-'];

//   if (model.startsWith('gemini-')) serviceName = 'GEMINI';
//   else if (model.startsWith('deepseek-')) serviceName = 'DEEPSEEK';
//   else if (model.startsWith('gpt-')) serviceName = 'OPENAI';
//   else if (model.startsWith('claude-')) serviceName = 'CLAUDE';
//   else if (!knownPrefixes.some(prefix => model.startsWith(prefix))) serviceName = 'SILICONFLOW';
//   else throw new Error(`不支持的模型或未知的模型前缀: ${model}`);

//   const serviceKeys = apiKeyManager.keys[serviceName];
//   const totalKeys = serviceKeys?.length || 0;
//   if (totalKeys === 0) {
//     throw new Error(`服务 ${serviceName} 没有任何可用的 API 密钥。`);
//   }

//   // !! 新增诊断日志 !!
//   console.log(`[AI Center] 检测到 ${totalKeys} 个 ${serviceName} 密钥。将按顺序尝试...`);

//   const startIndex = apiKeyManager.currentIndex[serviceName] || 0;
//   const keysToTry = [...serviceKeys.slice(startIndex), ...serviceKeys.slice(0, startIndex)];
//   let attempts = 0;

//   for (const currentApiKey of keysToTry) {
//     attempts++;
//     const currentIndexInManager = serviceKeys.indexOf(currentApiKey);
//     console.log(`[AI Center] 第 ${attempts} 次尝试, 调用模型: ${model} (使用 ${serviceName} 密钥索引: ${currentIndexInManager})`);

//     try {
//       let url, requestBody, finalAxiosConfig;
//       // ... [构建请求的代码块，保持不变]
//       switch (serviceName) {
//         case 'GEMINI':
//           url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey}`;
//           requestBody = { "contents": [{ "parts": [{ "text": prompt }, { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }] }] };
//           finalAxiosConfig = baseAxiosConfig;
//           break;
//         case 'DEEPSEEK':
//           url = 'https://api.deepseek.com/v1/chat/completions';
//           requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }] }] };
//           finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'Authorization': `Bearer ${currentApiKey}` } };
//           break;
//         case 'OPENAI':
//           url = 'https://api.openai.com/v1/chat/completions';
//           requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}`, "detail": "high" } }] }], "max_tokens": 2000 };
//           finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'Authorization': `Bearer ${currentApiKey}` } };
//           break;
//         case 'CLAUDE':
//           url = 'https://api.anthropic.com/v1/messages';
//           requestBody = { "model": model, "max_tokens": 2000, "messages": [{ "role": "user", "content": [{ "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": base64Image } }, { "type": "text", "text": prompt }] }] };
//           finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'x-api-key': currentApiKey, 'anthropic-version': '2023-06-01' } };
//           break;
//         case 'SILICONFLOW':
//           url = 'https://api.siliconflow.cn/v1/chat/completions';
//           requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }] }], "max_tokens": 2000 };
//           finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'Authorization': `Bearer ${currentApiKey}` } };
//           break;
//       }
      
//       console.log(`[${serviceName}] 正在向模型 [${model}] 发起请求...`);
//       const response = await axios.post(url, requestBody, finalAxiosConfig);
      
//       let resultText = null;
//       // ... [解析响应的代码块，保持不变]
//       if (serviceName === 'GEMINI' && response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
//         resultText = response.data.candidates[0].content.parts[0].text;
//       } else if ((serviceName === 'DEEPSEEK' || serviceName === 'OPENAI' || serviceName === 'SILICONFLOW') && response.data.choices?.[0]?.message?.content) {
//         resultText = response.data.choices[0].message.content;
//       } else if (serviceName === 'CLAUDE' && response.data.content?.[0]?.text) {
//         resultText = response.data.content[0].text;
//       }

//       if (resultText !== null) {
//         console.log(`[AI Center] ${serviceName} 模型调用成功！(使用密钥索引: ${currentIndexInManager})`);
//         apiKeyManager.setNextKeyIndex(serviceName, currentIndexInManager);
//         return resultText;
//       }
//       throw new Error(`${serviceName} API 返回了空的结果。`);

//     } catch (error) {
//       const errorMessage = error.response?.data?.error?.message || error.message;
//       const statusCode = error.response?.status;
//       console.error(`[${serviceName}] API 调用失败 (密钥索引: ${currentIndexInManager})。状态码: ${statusCode}, 错误: ${errorMessage}`);
      
//       if (statusCode === 429 || statusCode === 401) {
//           // !! 新增更清晰的切换日志 !!
//           if (attempts < totalKeys) {
//               console.log(`[ApiKeyManager] 密钥索引 ${currentIndexInManager} 失败。正在切换到下一个密钥...`);
//           }
//       } else {
//         throw new Error(`${serviceName} API 请求失败: ${errorMessage}`);
//       }
//     }
//   }

//   throw new Error(`服务 ${serviceName} 的所有 ${totalKeys} 个 API 密钥均调用失败，请检查密钥有效性或额度。`);
// }


// // =================================================================
// // 6. 启动服务器
// // =================================================================
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
//   console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
// });







// =================================================================
// 快答AI - 智能笔试辅助系统 (后端服务)
// 文件: index.js (最终版 - 增强重试逻辑)
// =================================================================

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
require('dotenv').config({ override: true }); // 使用 override 确保 .env 优先
console.log('============================================================');
console.log(`
  *   *   *****   *     *   *     *   *    *   ****** 
  *   *  *     *  *     *   **    *   *   *    *     *
   * *   *        *     *   * *   *   *  *     *     *
    *     *****   *     *   *  *  *   ***      *     *
    *          *  *     *   *   * *   *  *     *     *
    *    *     *  *     *   *    **   *   *    *     *
    *     *****    *****    *     *   *    *   ****** 
  `);
console.log('============================================================');

// 全局异常捕获
process.on('uncaughtException', (error, origin) => { console.error('FATAL: 捕获到未处理的异常:', error, origin); });
process.on('unhandledRejection', (reason, promise) => { console.error('FATAL: 捕获到未处理的 Promise Rejection:', reason); });


// =================================================================
// 1. API 密钥管理器
// =================================================================
class ApiKeyManager {
  constructor() {
    this.keys = {};
    this.currentIndex = {};
    this.loadKey('GEMINI', process.env.GEMINI_API_KEY);
    this.loadKey('DEEPSEEK', process.env.DEEPSEEK_API_KEY);
    this.loadKey('OPENAI', process.env.OPENAI_API_KEY);
    this.loadKey('CLAUDE', process.env.CLAUDE_API_KEY);
    this.loadKey('SILICONFLOW', process.env.SILICONFLOW_API_KEY);
  }

  loadKey(serviceName, keysString) {
    if (keysString && keysString.trim()) {
      this.keys[serviceName] = keysString.split(',').map(k => k.trim()).filter(Boolean);
      this.currentIndex[serviceName] = 0;
      if (this.keys[serviceName].length > 0) {
        console.log(`[ApiKeyManager] 成功加载 ${this.keys[serviceName].length} 个 ${serviceName} 密钥。`);
      } else {
        console.warn(`[ApiKeyManager] 警告: ${serviceName}_API_KEY 环境变量已设置，但未找到有效的密钥。`);
      }
    } else {
      console.warn(`[ApiKeyManager] 警告: 未找到服务 ${serviceName} 的 API 密钥配置。`);
      this.keys[serviceName] = [];
    }
  }

  setNextKeyIndex(serviceName, currentSuccessIndex) {
    const keyRing = this.keys[serviceName];
    if (!keyRing || keyRing.length === 0) return;
    this.currentIndex[serviceName] = (currentSuccessIndex + 1) % keyRing.length;
  }
}


// =================================================================
// 2. 初始化
// =================================================================
const apiKeyManager = new ApiKeyManager();
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 30000,
  pingTimeout: 20000,
  maxHttpBufferSize: 20 * 1024 * 1024
});
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET_KEY';


// =================================================================
// 3. API 路由 (用户认证)
// =================================================================
// ... (注册和登录部分代码保持不变)
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ message: '该邮箱已被注册' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { email, password: hashedPassword } });
    res.status(201).json({ message: '用户注册成功', userId: newUser.id });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: '邮箱和密码不能为空' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: '认证失败：用户不存在' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: '认证失败：密码错误' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: '登录成功', token: token, userId: user.id });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});


// =================================================================
// 4. WebSocket 逻辑
// =================================================================
// ... (WebSocket部分代码保持不变)
io.on('connection', (socket) => {
  console.log(`[Socket.IO] 一个客户端已连接: ${socket.id}`);
  socket.on('authenticate', (token) => {
    if (!token) return socket.disconnect();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.join(decoded.userId);
      console.log(`[Socket.IO] 客户端 ${socket.id} 认证成功，已加入房间 ${decoded.userId}`);
      socket.emit('authenticated');
    } catch (error) {
      console.log(`[Socket.IO] 认证失败: ${error.message}`);
      socket.disconnect();
    }
  });

  socket.on('submitQuestion', async (data) => {
    const { userId, image, prompt, model } = data;
    if (!image) return;
    try {
      const answer = await callAIModel({ base64Image: image, prompt, model });
      io.to(userId).emit('newAnswer', { answer, model, timestamp: new Date() });
    } catch (error) {
      console.error("[AI Center] AI 处理流程最终失败:", error.message);
      io.to(userId).emit('error', { message: `AI处理失败: ${error.message}` });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] 客户端已断开: ${socket.id}, 原因: ${reason}`);
  });
});


// =================================================================
// 5. AI 模型调用中心 (已更新错误处理逻辑)
// =================================================================
async function callAIModel({ base64Image, prompt, model }) {
  const socksPort = 10808;
  const proxyAgent = new SocksProxyAgent(`socks5h://127.0.0.1:${socksPort}`);
  const baseAxiosConfig = {
    headers: { 'Content-Type': 'application/json' },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
    timeout: 30000
  };

  let serviceName = '';
  const knownPrefixes = ['gemini-', 'deepseek-', 'gpt-', 'claude-'];

  if (model.startsWith('gemini-')) serviceName = 'GEMINI';
  else if (model.startsWith('deepseek-')) serviceName = 'DEEPSEEK';
  else if (model.startsWith('gpt-')) serviceName = 'OPENAI';
  else if (model.startsWith('claude-')) serviceName = 'CLAUDE';
  else if (!knownPrefixes.some(prefix => model.startsWith(prefix))) serviceName = 'SILICONFLOW';
  else throw new Error(`不支持的模型或未知的模型前缀: ${model}`);

  const serviceKeys = apiKeyManager.keys[serviceName];
  const totalKeys = serviceKeys?.length || 0;
  if (totalKeys === 0) {
    throw new Error(`服务 ${serviceName} 没有任何可用的 API 密钥。`);
  }

  console.log(`[AI Center] 检测到 ${totalKeys} 个 ${serviceName} 密钥。将按顺序尝试...`);

  const startIndex = apiKeyManager.currentIndex[serviceName] || 0;
  const keysToTry = [...serviceKeys.slice(startIndex), ...serviceKeys.slice(0, startIndex)];
  let attempts = 0;

  for (const currentApiKey of keysToTry) {
    attempts++;
    const currentIndexInManager = serviceKeys.indexOf(currentApiKey);
    console.log(`[AI Center] 第 ${attempts} 次尝试, 调用模型: ${model} (使用 ${serviceName} 密钥索引: ${currentIndexInManager})`);

    try {
      // ... [构建请求的部分保持不变]
      let url, requestBody, finalAxiosConfig;
      switch (serviceName) {
        case 'GEMINI':
          url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey}`;
          requestBody = { "contents": [{ "parts": [{ "text": prompt }, { "inline_data": { "mime_type": "image/jpeg", "data": base64Image } }] }] };
          finalAxiosConfig = baseAxiosConfig;
          break;
        case 'DEEPSEEK':
          url = 'https://api.deepseek.com/v1/chat/completions';
          requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }] }] };
          finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'Authorization': `Bearer ${currentApiKey}` } };
          break;
        case 'OPENAI':
          url = 'https://api.openai.com/v1/chat/completions';
          requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}`, "detail": "high" } }] }], "max_tokens": 2000 };
          finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'Authorization': `Bearer ${currentApiKey}` } };
          break;
        case 'CLAUDE':
          url = 'https://api.anthropic.com/v1/messages';
          requestBody = { "model": model, "max_tokens": 2000, "messages": [{ "role": "user", "content": [{ "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": base64Image } }, { "type": "text", "text": prompt }] }] };
          finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'x-api-key': currentApiKey, 'anthropic-version': '2023-06-01' } };
          break;
        case 'SILICONFLOW':
          url = 'https://api.siliconflow.cn/v1/chat/completions';
          requestBody = { "model": model, "messages": [{ "role": "user", "content": [{ "type": "text", "text": prompt }, { "type": "image_url", "image_url": { "url": `data:image/jpeg;base64,${base64Image}` } }] }], "max_tokens": 2000 };
          finalAxiosConfig = { ...baseAxiosConfig, headers: { ...baseAxiosConfig.headers, 'Authorization': `Bearer ${currentApiKey}` } };
          break;
      }
      
      console.log(`[${serviceName}] 正在向模型 [${model}] 发起请求...`);
      const response = await axios.post(url, requestBody, finalAxiosConfig);

      // ... [解析响应的部分保持不变]
      let resultText = null;
      if (serviceName === 'GEMINI' && response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        resultText = response.data.candidates[0].content.parts[0].text;
      } else if ((serviceName === 'DEEPSEEK' || serviceName === 'OPENAI' || serviceName === 'SILICONFLOW') && response.data.choices?.[0]?.message?.content) {
        resultText = response.data.choices[0].message.content;
      } else if (serviceName === 'CLAUDE' && response.data.content?.[0]?.text) {
        resultText = response.data.content[0].text;
      }

      if (resultText !== null) {
        console.log(`[AI Center] ${serviceName} 模型调用成功！(使用密钥索引: ${currentIndexInManager})`);
        apiKeyManager.setNextKeyIndex(serviceName, currentIndexInManager);
        return resultText;
      }
      throw new Error(`${serviceName} API 返回了空的结果。`);

    } catch (error) {
      // !! 核心改动 !!
      const errorMessage = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;
      console.error(`[${serviceName}] API 调用失败 (密钥索引: ${currentIndexInManager})。状态码: ${statusCode}, 错误: ${errorMessage}`);
      
      // 定义致命错误，遇到这些错误时应立即停止，因为重试也无用
      const fatalStatusCodes = [400, 403, 404]; // 400:请求错误, 403:禁止访问, 404:未找到
      
      if (fatalStatusCodes.includes(statusCode)) {
        // 如果是致命错误，则不再尝试其他密钥，直接向上抛出异常
        throw new Error(`[${serviceName}] API 请求遇到致命错误 (${statusCode})，已停止重试: ${errorMessage}`);
      } else {
        // 对于其他所有错误（如 401, 429, 500, 503, 网络超时等），都继续尝试下一个密钥
        if (attempts < totalKeys) {
          console.log(`[ApiKeyManager] 密钥索引 ${currentIndexInManager} 失败 (原因: ${statusCode || 'Network Error'})。正在切换到下一个密钥...`);
        }
      }
      // 让 for 循环自然地进入下一次迭代
    }
  }

  // 如果循环结束了还没有成功返回，说明所有密钥都尝试失败了
  throw new Error(`服务 ${serviceName} 的所有 ${totalKeys} 个 API 密钥均调用失败，请检查密钥有效性或额度。`);
}


// =================================================================
// 6. 启动服务器
// =================================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 服务器正在端口 ${PORT} 上运行`);
  console.log(`🔗 本地访问地址: http://localhost:${PORT}`);
});