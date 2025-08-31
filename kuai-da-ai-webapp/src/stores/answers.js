// src/stores/answers.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useAnswersStore = defineStore('answers', () => {
  const socket = ref(null)
  const isConnected = ref(false)
  const answers = ref([])

  function connect(token) {
    if (socket.value) return;
    socket.value = io('http://192.168.1.75:3000');

    socket.value.on('connect', () => socket.value.emit('authenticate', token));
    socket.value.on('authenticated', () => isConnected.value = true);
    socket.value.on('disconnect', () => isConnected.value = false);
    socket.value.on('newAnswer', (data) => answers.value.unshift(data));
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
      answers.value = [];
    }
  }

  return { isConnected, answers, connect, disconnect }
})



// import { ref } from 'vue'
// import { defineStore } from 'pinia'
// import { io } from 'socket.io-client'

// export const useAnswersStore = defineStore('answers', () => {
//   const socket = ref(null)
//   const isConnected = ref(false)
//   const answers = ref([])

//   function connect(token) {
//     if (socket.value) return;

//     // !! 核心改动：在客户端也添加超时和数据包大小限制配置 !!
//     socket.value = io('http://localhost:3000', {
//       reconnection: true,
//       reconnectionAttempts: Infinity,
//       timeout: 20000,
//       pingTimeout: 20000
//     });

//     socket.value.on('connect', () => {
//         console.log('[WebApp] 成功连接到 WebSocket 服务器!');
//         socket.value.emit('authenticate', token);
//     });

//     socket.value.on('authenticated', () => {
//         console.log('[WebApp] WebSocket 认证成功!');
//         isConnected.value = true;
//     });

//     socket.value.on('newAnswer', (data) => {
//         console.log('[WebApp] 收到新答案:', data);
//         answers.value.unshift(data);
//     });

//     socket.value.on('disconnect', (reason) => {
//         console.log(`[WebApp] 与 WebSocket 服务器断开连接, 原因: ${reason}`);
//         isConnected.value = false;
//     });
//   }

//   function disconnect() {
//     if (socket.value) {
//       socket.value.disconnect();
//       socket.value = null;
//       isConnected.value = false;
//       answers.value = [];
//     }
//   }

//   return { isConnected, answers, connect, disconnect }
// })




// import { ref } from 'vue'
// import { defineStore } from 'pinia'
// import { io } from 'socket.io-client'

// export const useAnswersStore = defineStore('answers', () => {
//   const socket = ref(null)
//   const isConnected = ref(false)
//   const answers = ref([])

//   function connect(token) {
//     if (socket.value) return;

//     // !! 核心：这是最干净、最稳定的客户端配置 !!
//     socket.value = io('http://localhost:3000', {
//       reconnection: true,
//       reconnectionAttempts: Infinity,
//       timeout: 20000,
//       pingTimeout: 20000
//     });

//     socket.value.on('connect', () => {
//         console.log('[WebApp] 成功连接到 WebSocket 服务器!');
//         socket.value.emit('authenticate', token);
//     });

//     socket.value.on('authenticated', () => {
//         console.log('[WebApp] WebSocket 认证成功!');
//         isConnected.value = true;
//     });

//     socket.value.on('newAnswer', (data) => {
//         console.log('[WebApp] 收到新答案:', data);
//         answers.value.unshift(data);
//     });

//     socket.value.on('disconnect', (reason) => {
//         console.log(`[WebApp] 与 WebSocket 服务器断开连接, 原因: ${reason}`);
//         isConnected.value = false;
//     });
//   }

//   function disconnect() {
//     if (socket.value) {
//       socket.value.disconnect();
//       socket.value = null;
//       isConnected.value = false;
//       answers.value = [];
//     }
//   }

//   return { isConnected, answers, connect, disconnect }
// })