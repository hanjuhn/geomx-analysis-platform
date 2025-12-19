// worker.js
// GitHub Pages를 위한 base URL 처리
// worker.js의 경로에서 base URL 추출
const workerPath = self.location.pathname;
// /pyodide/worker.js 또는 /geomx-analysis-platform/pyodide/worker.js 형태
let basePath = '/';
if (workerPath.includes('/pyodide/')) {
  basePath = workerPath.substring(0, workerPath.lastIndexOf('/pyodide/') + 1);
} else if (workerPath.endsWith('worker.js')) {
  // worker.js가 루트에 있는 경우
  basePath = workerPath.substring(0, workerPath.lastIndexOf('/') + 1);
}
const scripts = [
    "packages.js",
    "dataStore.js",
    "gmtFetch.js",
    "volcano.js",
    "heatmap.js",
    "ssGSEA.js",
    "corr.js",
    "enrichBar.js"
].map(script => {
  const scriptPath = `${basePath}pyodide/${script}`;
  return new URL(scriptPath, self.location.origin + '/').href;
});

importScripts(...scripts)
  
  let isReady = false
  
  // packages.js에서 pyodide-ready를 보내면 외부로 전달 (이미 postMessage로 전달됨)
  // 외부에서 오는 메시지 처리
  self.onmessage = function (event) {
    const { type, payload } = event.data
  
    // ✅ 데이터 저장
    handleDataMessage(event)
  
    // ✅ GMT Fetch
    handleGmtFetchMessage(event)
  
    // ✅ Volcano
    handleVolcanoMessage(event)
  
    // ✅ Heatmap
    handleHeatmapMessage(event)
  
    // ✅ ssGSEA Heatmap
    handleSsGSEAMessage(event)
  
    // ✅ Spearman Corr
    handleCorrMessage(event)
  
    // ✅ Enrichment Bar
    handleEnrichBarMessage(event)
  }