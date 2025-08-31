// vite.config.ts

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 使用 Electron 插件
    electron([
      {
        // 主进程入口文件
        entry: 'electron/main.ts',
      },
      {
        // Preload 脚本入口文件 (我们稍后会用到)
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),

    renderer(),
  ],
})