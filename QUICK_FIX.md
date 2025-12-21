# 빠른 해결 방법

## 문제
GitHub Pages가 계속 소스 `index.html`을 서빙하고 있어 `src/main.jsx` 404 오류가 발생합니다.

## 즉시 해결 방법

### ⚠️ 가장 중요: GitHub Pages 설정 변경

1. **GitHub 리포지토리로 이동**
   - `https://github.com/hanjuhn/geomx-analysis-platform`
   - 또는 `https://github.com/hanjuhn/webr-geomx` (리포지토리가 이동했다면)

2. **Settings → Pages** 메뉴로 이동

3. **Source 설정 확인**
   - 현재 **"Deploy from a branch"**로 되어 있다면 → 이것이 문제입니다!
   - **"GitHub Actions"**로 변경
   - 저장

4. **배포 확인**
   - Settings → Pages에서 "Your site is live at..." 메시지 확인
   - 배포 상태가 "Published"인지 확인

### GitHub Actions 수동 실행

1. 리포지토리 → **Actions** 탭
2. 왼쪽에서 **"Deploy to GitHub Pages"** 워크플로우 선택
3. 오른쪽 상단 **"Run workflow"** 버튼 클릭
4. **"Run workflow"** 클릭하여 실행
5. 워크플로우가 완료될 때까지 대기 (약 1-2분)

### 배포 확인

배포가 완료되면:
- URL: `https://hanjuhn.github.io/geomx-analysis-platform/`
- 브라우저 개발자 도구(F12) → Network 탭
- `/geomx-analysis-platform/assets/index-xxx.js`가 로드되는지 확인
- `src/main.jsx`를 로드하려고 시도하지 않아야 함

## 여전히 안 되면

### 수동 배포 (gh-pages 브랜치 사용)

```bash
# 1. 빌드
npm run build:gh-pages

# 2. gh-pages 설치 (처음 한 번만)
npm install -g gh-pages

# 3. 배포
gh-pages -d dist

# 4. GitHub Pages 설정
# Settings → Pages → Source: "Deploy from a branch" → Branch: "gh-pages" → "/ (root)"
```

이 방법을 사용하면 GitHub Actions 없이도 배포할 수 있습니다.

