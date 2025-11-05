// worker.js
importScripts(
    "/pyodide/packages.js",
    "/pyodide/dataStore.js",
    "/pyodide/gmtFetch.js",
    "/pyodide/volcano.js",
    "/pyodide/heatmap.js",
    "/pyodide/ssGSEA.js",
    "/pyodide/corr.js",
    "/pyodide/enrichBar.js"
  )
  
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