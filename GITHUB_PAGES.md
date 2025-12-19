# GitHub Pages 배포 가이드

1. **로컬에서 빌드:**
   ```bash
   npm run build:gh-pages
   ```

2. **빌드된 파일 확인:**
   ```bash
   cat dist/index.html
   ```
   - 올바른 경우: `/geomx-analysis-platform/assets/index-xxx.js` 형태
   - 잘못된 경우: `/src/main.jsx` 형태

3. **빌드된 파일 배포:**
   - 방법 A: GitHub Actions 사용 (권장, 아래 참조)
   - 방법 B: 수동 배포 (아래 참조)

---

## 배포 방법

### 방법 1: GitHub Actions 사용 (권장) ⭐

1. **리포지토리 설정 확인**
   - 현재 리포지토리 이름이 `geomx-analysis-platform`인 경우, `vite.config.js`의 base 경로가 `/geomx-analysis-platform/`로 설정되어 있습니다.
   - 리포지토리 이름이 다르다면 `vite.config.js`를 수정하세요.

2. **GitHub Actions 워크플로우 사용**
   - `.github/workflows/deploy.yml` 파일이 이미 생성되어 있습니다.
   - `main` 브랜치에 푸시하면 자동으로 빌드되고 배포됩니다.

3. **GitHub Pages 설정**
   - GitHub 리포지토리 → Settings → Pages
   - Source: `GitHub Actions`
   - Save

4. **배포 확인**
   - Actions 탭에서 배포 상태 확인
   - 배포 완료 후 `https://hanjuhn.github.io/geomx-analysis-platform/` 접속
   - **주의**: `/geomx-analysis-platform/` 경로로 접속해야 합니다!

### 방법 2: 수동 배포

#### 방법 A: `docs` 폴더 사용
1. `vite.config.js`에 다음을 추가:
```javascript
export default defineConfig({
  // ... 기존 설정
  build: {
    outDir: 'docs'
  }
})
```

2. 빌드 후 `docs` 폴더를 커밋:
```bash
npm run build:gh-pages
git add docs
git commit -m "Deploy to GitHub Pages"
git push
```

3. GitHub 리포지토리 설정:
   - Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `main` (또는 `master`)
   - Folder: `/docs`
   - Save

#### 방법 B: `gh-pages` 브랜치 사용
1. 빌드:
```bash
npm run build:gh-pages
```

2. `dist` 폴더를 `gh-pages` 브랜치에 푸시:
```bash
npm install -g gh-pages
gh-pages -d dist
```

3. GitHub 리포지토리 설정:
   - Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `gh-pages`
   - Folder: `/ (root)`
   - Save