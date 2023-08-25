/// <reference types="vitest" />
/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  // server: { 
  //   //用来配置跨域
  //   proxy: {
  //     '/api': {
  //       target: 'http://127.0.0.1:50000',//目标服务器地址
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/api/, '')
  //     },
  //   }
  // },
  build:{
    target: "es2015",
    minify: false  
  },
  plugins: [
    vue(),
    // element-plus auto import
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  test:{
    environment: 'happy-dom',
    deps:{
      inline: ['element-plus']
    }
  },
  test:{
    environment: 'happy-dom',
    deps:{
      inline: ['element-plus']
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    dedupe: ['vue']
    },
    dedupe: ['vue']
  }
})
