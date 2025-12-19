# GitHub Pages 배포 가이드

## 배포 방법

### 1. 리포지토리 이름 확인
현재 리포지토리 이름이 `geomx-analysis-platform`인 경우, `vite.config.js`의 base 경로가 `/geomx-analysis-platform/`로 설정되어 있습니다.
리포지토리 이름이 다르다면 `vite.config.js`를 수정하세요.

### 2. 빌드
```bash
npm run build
```

### 3. GitHub Pages 설정

#### 방법 A: `docs` 폴더 사용 (권장)
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
npm run build
git add docs
git commit -m "Add GitHub Pages build"
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
npm run build
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

### 4. 환경 변수 설정 (선택사항)
리포지토리 이름이 다르거나 루트 도메인을 사용하는 경우:

```bash
# 루트 도메인 사용 시
GITHUB_PAGES=false npm run build

# 다른 리포지토리 이름 사용 시
# vite.config.js에서 base 경로를 직접 수정
```

## 확인 사항

배포 후 다음을 확인하세요:
- ✅ Worker 파일이 정상적으로 로드되는지
- ✅ 이미지가 정상적으로 표시되는지
- ✅ 모든 정적 리소스가 올바른 경로에서 로드되는지

## 문제 해결

### Worker가 로드되지 않는 경우
- 브라우저 콘솔에서 Worker URL 확인
- `import.meta.env.BASE_URL` 값 확인
- GitHub Pages의 base 경로가 올바른지 확인

### 404 오류가 발생하는 경우
- `vite.config.js`의 `base` 설정 확인
- 빌드된 파일의 경로가 올바른지 확인
- GitHub Pages 설정에서 올바른 폴더를 선택했는지 확인

