// gmtFetch.js

async function handleGmtFetchMessage(event) {
  const { type, payload } = event.data

  if (type === "fetchGmtByLibrary") {
    const { library } = payload || {}
    
    if (!library) {
      postMessage({
        type: "fetchGmtByLibrary-error",
        error: "라이브러리 이름이 필요합니다"
      })
      return
    }

    try {
      // WikiPathways GMT URL
      let gmtUrl = ""
      if (library === "WikiPathways") {
        // 최신 WikiPathways GMT URL (여러 옵션 시도)
        gmtUrl = "https://wikipathways-data.wmcloud.org/current/gmt/wikipathways-20240510-gmt-Homo_sapiens.gmt"
      } else {
        postMessage({
          type: "fetchGmtByLibrary-error",
          error: `알 수 없는 라이브러리: ${library}`
        })
        return
      }

      // Worker에서 fetch 사용 (CORS 제약이 있으므로, 메인 스레드에서 fetch를 요청)
      // Worker는 직접 fetch를 사용할 수 있지만, CORS 문제가 있을 수 있음
      // 대신 fetch를 사용하되, 에러 처리를 개선
      try {
        const response = await fetch(gmtUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
          },
          mode: 'cors',
          cache: 'no-cache'
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const gmtText = await response.text()
        
        if (!gmtText || gmtText.trim().length === 0) {
          throw new Error("GMT 파일이 비어있습니다")
        }

        postMessage({
          type: "fetchGmtByLibrary-result",
          gmt: gmtText
        })
      } catch (fetchErr) {
        // CORS 문제가 있을 경우, 대체 URL 시도 또는 에러 메시지 개선
        postMessage({
          type: "fetchGmtByLibrary-error",
          error: `네트워크 오류: ${fetchErr.message}. URL: ${gmtUrl}`
        })
      }
    } catch (err) {
      postMessage({
        type: "fetchGmtByLibrary-error",
        error: err.toString()
      })
    }
  }

  if (type === "fetchGmtByUrl") {
    const { url } = payload || {}
    
    if (!url) {
      postMessage({
        type: "fetchGmtByUrl-error",
        error: "URL이 필요합니다"
      })
      return
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        mode: 'cors',
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const gmtText = await response.text()
      
      if (!gmtText || gmtText.trim().length === 0) {
        throw new Error("GMT 파일이 비어있습니다")
      }

      postMessage({
        type: "fetchGmtByUrl-result",
        gmt: gmtText
      })
    } catch (err) {
      postMessage({
        type: "fetchGmtByUrl-error",
        error: `네트워크 오류: ${err.message}. URL: ${url}`
      })
    }
  }
}

