import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// GitHub Pages 배포를 위한 base 경로 설정
// 리포지토리 이름이 다르면 여기를 수정하세요
const base = process.env.GITHUB_PAGES === 'true' ? '/geomx-analysis-platform/' : '/';

export default defineConfig({
  plugins: [
    react(),
    // 빌드 후 .nojekyll 파일을 dist 폴더에 복사하는 플러그인
    {
      name: 'copy-nojekyll',
      closeBundle() {
        const src = join(process.cwd(), 'public', '.nojekyll')
        const dest = join(process.cwd(), 'dist', '.nojekyll')
        try {
          copyFileSync(src, dest)
          console.log('✓ Copied .nojekyll to dist/')
        } catch (err) {
          console.warn('⚠ Failed to copy .nojekyll:', err.message)
        }
      }
    }
  ],
  base: base,
  optimizeDeps: {
    exclude: ['webr']
  }
})