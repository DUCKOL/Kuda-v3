// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. 导入
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia() // 2. 创建实例

app.use(pinia) // 3. 使用
app.mount('#app')