import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 배포를 위한 base 경로 설정
// 리포지토리 이름이 다르면 여기를 수정하세요
const base = process.env.GITHUB_PAGES === 'true' ? '/webr-geomx/' : '/';

export default defineConfig({
  plugins: [react()],
  base: base,
  optimizeDeps: {
    exclude: ['webr']
  }
})