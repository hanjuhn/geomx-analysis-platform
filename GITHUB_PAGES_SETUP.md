# GitHub Pages 설정 가이드

## 현재 문제
GitHub Pages가 빌드된 파일 대신 소스 `index.html`을 서빙하고 있어 `src/main.jsx` 404 오류가 발생합니다.

## 해결 방법

### 방법 1: GitHub Pages 설정 변경 (권장)

1. **GitHub 리포지토리로 이동**
   - `https://github.com/hanjuhn/geomx-analysis-platform` (또는 실제 리포지토리 URL)

2. **Settings → Pages로 이동**

3. **Source 설정 변경**
   - 현재 설정이 "Deploy from a branch"로 되어 있다면:
     - **Source** 드롭다운에서 **"GitHub Actions"** 선택
     - 저장
   
   - 또는 "Deploy from a branch"를 사용한다면:
     - Branch: `gh-pages` 선택
     - Folder: `/ (root)` 선택
     - 저장

4. **변경사항 커밋 및 푸시**
   ```bash
   git add vite.config.js dist/
   git commit -m "Fix GitHub Pages base path"
   git push origin main
   ```

5. **GitHub Actions 확인**
   - 리포지토리 → **Actions** 탭
   - "Deploy to GitHub Pages" 워크플로우가 실행되는지 확인
   - 실행되지 않으면 위의 커밋/푸시로 트리거됨

### 방법 2: 수동으로 gh-pages 브랜치에 배포

GitHub Actions가 작동하지 않는 경우:

```bash
# 1. 빌드
npm run build:gh-pages

# 2. gh-pages 패키지 설치 (처음 한 번만)
npm install -g gh-pages

# 3. dist 폴더를 gh-pages 브랜치에 배포
gh-pages -d dist

# 4. GitHub Pages 설정
# Settings → Pages → Source: "Deploy from a branch" → Branch: "gh-pages" → "/ (root)"
```

### 방법 3: GitHub Actions 워크플로우 확인

1. **리포지토리 → Actions 탭**
2. 최근 워크플로우 실행 확인
3. 실패한 경우:
   - 워크플로우 클릭 → 오류 메시지 확인
   - 일반적인 오류:
     - **Permission denied**: Settings → Actions → General → Workflow permissions → "Read and write permissions" 확인
     - **Missing environment**: 이미 수정됨 (`environment: name: github-pages`)

## 확인 사항

### 1. 리포지토리 이름 확인
현재 `vite.config.js`는 `/geomx-analysis-platform/`을 사용합니다.
- 리포지토리 이름이 다르면 `vite.config.js`의 base 경로를 수정하세요.

### 2. 올바른 URL로 접속
- ✅ 올바른 URL: `https://hanjuhn.github.io/geomx-analysis-platform/`
- ❌ 잘못된 URL: `https://hanjuhn.github.io/` (루트)

### 3. 브라우저 개발자 도구 확인
- F12 → Network 탭
- 올바른 경우: `/geomx-analysis-platform/assets/index-xxx.js` 로드
- 잘못된 경우: `/src/main.jsx` 로드 시도

## 배포 확인

배포가 완료되면:
1. GitHub 리포지토리 → **Settings** → **Pages**에서 배포 URL 확인
2. 배포 상태가 "Published"인지 확인
3. 올바른 URL로 접속하여 테스트

## 문제 해결

### 여전히 `src/main.jsx` 404 오류가 발생하는 경우

1. **브라우저 캐시 삭제**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac)
   - 또는 개발자 도구 → Network 탭 → "Disable cache" 체크

2. **GitHub Pages 설정 재확인**
   - Source가 "GitHub Actions" 또는 "gh-pages" 브랜치인지 확인
   - 빌드된 파일이 배포되었는지 확인

3. **GitHub Actions 로그 확인**
   - Actions 탭 → 최근 워크플로우 실행 → 로그 확인
   - 배포가 성공했는지 확인

4. **수동 배포 시도**
   ```bash
   npm run build:gh-pages
   gh-pages -d dist
   ```

