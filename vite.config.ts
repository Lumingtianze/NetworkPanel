import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from "rollup-plugin-visualizer"
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.png', 'icon-fill.png'],
      manifest: {
        name: "网络面板",
        short_name: "网络面板",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        lang: "zh-CN",
        scope: "/",
        description: "网络面板(NetworkPanel)是一个在线流量消耗器，可以测试您的网速，监测您的网络环境，提供丰富测试节点，并且长期维护更新",
        icons: [
          {
            src: "./icon.png",
            sizes: "144x144",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true
      }
    }),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: "visualizer.html",
      template: "sunburst",
      open: false
    }) as unknown as PluginOption
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    assetsDir: 'assets',
    assetsInlineLimit: 8 * 1024,
    rollupOptions: {
      output: {
        manualChunks: undefined 
      }
    }
  },
  server: {
    open: true,
    port: 3005,
    host: '0.0.0.0'
  },
  base: './'
})