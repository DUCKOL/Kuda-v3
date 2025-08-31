// src/stores/websocket.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'

export const useWebsocketStore = defineStore('websocket', () => {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  function connect(token: string) {
    if (socket.value) return;

    socket.value = io('http://localhost:3000');

    socket.value.on('connect', () => {
      console.log('连接到 WebSocket 服务器...');
      socket.value?.emit('authenticate', token);
    });

    socket.value.on('authenticated', () => {
      console.log('WebSocket 认证成功!');
      isConnected.value = true;
    });
    
    socket.value.on('disconnect', () => {
      console.log('与 WebSocket 服务器断开');
      isConnected.value = false;
    });
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }
  
  return { socket, isConnected, connect, disconnect }
})



// import { ref } from 'vue'
// import { defineStore } from 'pinia'
// import { io, Socket } from 'socket.io-client'

// export const useWebsocketStore = defineStore('websocket', () => {
//   const socket = ref<Socket | null>(null)
//   const isConnected = ref(false)

//   function connect(token: string) {
//     if (socket.value) return;

//     // !! 核心改动：在桌面客户端也添加超时和数据包大小限制配置 !!
//     socket.value = io('http://localhost:3000', {
//         reconnection: true,
//         reconnectionAttempts: Infinity,
//         timeout: 20000,
//         pingTimeout: 20000
//     });

//     socket.value.on('connect', () => {
//       console.log('[Desktop App] 连接到 WebSocket 服务器...');
//       socket.value?.emit('authenticate', token);
//     });

//     socket.value.on('authenticated', () => {
//       console.log('[Desktop App] WebSocket 认证成功!');
//       isConnected.value = true;
//     });
    
//     socket.value.on('disconnect', (reason) => {
//       console.log(`[Desktop App] 与 WebSocket 服务器断开, 原因: ${reason}`);
//       isConnected.value = false;
//     });
//   }

//   function disconnect() {
//     if (socket.value) {
//       socket.value.disconnect()
//       socket.value = null
//       isConnected.value = false
//     }
//   }
  
//   return { socket, isConnected, connect, disconnect }
// })




// import { ref } from 'vue'
// import { defineStore } from 'pinia'
// import { io, Socket } from 'socket.io-client'

// export const useWebsocketStore = defineStore('websocket', () => {
//   const socket = ref<Socket | null>(null)
//   const isConnected = ref(false)

//   function connect(token: string) {
//     if (socket.value) return;

//     // !! 核心：这是最干净、最稳定的客户端配置 !!
//     socket.value = io('http://localhost:3000', {
//         reconnection: true,
//         reconnectionAttempts: Infinity,
//         timeout: 20000,
//         pingTimeout: 20000
//     });

//     socket.value.on('connect', () => {
//       console.log('[Desktop App] 连接到 WebSocket 服务器...');
//       socket.value?.emit('authenticate', token);
//     });

//     socket.value.on('authenticated', () => {
//       console.log('[Desktop App] WebSocket 认证成功!');
//       isConnected.value = true;
//     });
    
//     socket.value.on('disconnect', (reason) => {
//       console.log(`[Desktop App] 与 WebSocket 服务器断开, 原因: ${reason}`);
//       isConnected.value = false;
//     });
//   }

//   function disconnect() {
//     if (socket.value) {
//       socket.value.disconnect()
//       socket.value = null
//       isConnected.value = false
//     }
//   }
  
//   return { socket, isConnected, connect, disconnect }
// })