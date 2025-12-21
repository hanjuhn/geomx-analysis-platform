# GitHub Pages 배포 문제 해결 가이드

## 현재 문제
GitHub Pages가 빌드된 파일 대신 소스 `index.html`을 서빙하고 있어 `src/main.jsx` 404 오류가 발생합니다.

## 즉시 해결 방법

### 방법 1: GitHub Pages 설정 확인 및 변경 (가장 중요!)

1. **GitHub 리포지토리로 이동**
   - `https://github.com/hanjuhn/geomx-analysis-platform`

2. **Settings → Pages로 이동**

3. **Source 확인 및 변경**
   - 현재 설정이 **"Deploy from a branch"**로 되어 있다면:
     - 이것이 문제의 원인입니다!
     - **Source** 드롭다운에서 **"GitHub Actions"** 선택
     - 저장
   
4. **배포 확인**
   - Settings → Pages에서 배포 상태 확인
   - "Your site is live at..." 메시지가 보이면 성공

### 방법 2: GitHub Actions 확인

1. **리포지토리 → Actions 탭**
2. 최근 워크플로우 실행 확인:
   - "Deploy to GitHub Pages" 워크플로우가 실행되었는지 확인
   - 실행되지 않았다면, 빈 커밋으로 트리거:
     ```bash
     git commit --allow-empty -m "Trigger GitHub Pages deployment"
     git push origin main
     ```
3. 워크플로우가 실패했다면:
   - 워크플로우 클릭 → 오류 메시지 확인
   - 일반적인 오류:
     - **Permission denied**: Settings → Actions → General → Workflow permissions → "Read and write permissions" 확인

### 방법 3: 수동 배포 (임시 해결책)

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

## 확인 사항 체크리스트

- [ ] GitHub Pages 설정이 "GitHub Actions"로 되어 있는가?
- [ ] GitHub Actions 워크플로우가 실행되었는가?
- [ ] 워크플로우가 성공적으로 완료되었는가?
- [ ] 배포 URL이 올바른가? (`https://hanjuhn.github.io/geomx-analysis-platform/`)
- [ ] 브라우저 캐시를 삭제했는가? (`Ctrl+Shift+R` 또는 `Cmd+Shift+R`)

## 예상 결과

배포가 성공하면:
- 브라우저 개발자 도구(F12) → Network 탭에서 `/geomx-analysis-platform/assets/index-xxx.js` 로드
- `src/main.jsx`를 로드하려고 시도하지 않음
- 모든 정적 파일이 올바른 경로로 로드됨

