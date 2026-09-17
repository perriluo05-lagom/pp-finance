import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 相对路径：支持从子目录（CDN/GitHub Pages 仓库名）打开
  base: './',
})
