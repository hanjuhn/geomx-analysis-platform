// src/core/usePyodide.js

import { useEffect, useRef, useState } from "react";

export default function usePyodide() {
  const workerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = new Worker("/pyodide/worker.js");
    workerRef.current = w;

    w.onmessage = (e) => {
      const { type } = e.data;
      if (type === "pyodide-ready" || type === "worker-ready") {
        setReady(true);
      }
    };

    return () => w.terminate();
  }, []);

  const runPython = (code) => {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === "runPython-result") {
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.result);
        }
        if (e.data.type === "runPython-error") {
          workerRef.current.removeEventListener("message", handler);
          reject(e.data.error);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "runPython", payload: { code } });
    });
  };

  const setData = (text) => {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.data.type === "setData-complete") {
          workerRef.current.removeEventListener("message", handler);
          resolve(true);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "setData", payload: text });
    });
  };

  const setHeatmap = (text) => {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.data.type === "setHeatmap-complete") {
          workerRef.current.removeEventListener("message", handler);
          resolve(true);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "setHeatmap", payload: text });
    });
  };

  const setExpr = (text) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        workerRef.current.removeEventListener("message", handler);
        reject(new Error("setExpr 타임아웃"));
      }, 10000);
      const handler = (e) => {
        if (e.data.type === "setExpr-complete") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          resolve(true);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "setExpr", payload: text });
    });
  };

  const setGeneSets = (text) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        workerRef.current.removeEventListener("message", handler);
        reject(new Error("setGeneSets 타임아웃"));
      }, 10000);
      const handler = (e) => {
        if (e.data.type === "setGeneSets-complete") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          resolve(true);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "setGeneSets", payload: text });
    });
  };

  const setGroupInfo = (metaJson) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        workerRef.current.removeEventListener("message", handler);
        reject(new Error("setGroupInfo 타임아웃"));
      }, 10000);
      const handler = (e) => {
        if (e.data.type === "setGroupInfo-complete") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          resolve(true);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "setGroupInfo", payload: metaJson });
    });
  };

  const plotVolcano = () => {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === "plotVolcano-result") {
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.image);
        }
        if (e.data.type === "plotVolcano-error") {
          workerRef.current.removeEventListener("message", handler);
          reject(e.data.error);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "plotVolcano" });
    });
  };

  const plotHeatmap = () => {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === "plotHeatmap-result") {
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.image);
        }
        if (e.data.type === "plotHeatmap-error") {
          workerRef.current.removeEventListener("message", handler);
          reject(e.data.error);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "plotHeatmap" });
    });
  };

  const plotSsGSEAHeatmap = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        workerRef.current.removeEventListener("message", handler);
        reject(new Error("plotSsGSEAHeatmap 타임아웃 (60초)"));
      }, 60000);
      const handler = (e) => {
        if (e.data.type === "plotSsGSEAHeatmap-result") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.image);
        }
        if (e.data.type === "plotSsGSEAHeatmap-error") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          reject(new Error(e.data.error));
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "plotSsGSEAHeatmap" });
    });
  };

  const plotPathwayCorr = () => {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === "plotPathwayCorr-result") {
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.image);
        }
        if (e.data.type === "plotPathwayCorr-error") {
          workerRef.current.removeEventListener("message", handler);
          reject(e.data.error);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "plotPathwayCorr" });
    });
  };

  const fetchGmtByUrl = (url) => {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === "fetchGmtByUrl-result") {
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.gmt);
        }
        if (e.data.type === "fetchGmtByUrl-error") {
          workerRef.current.removeEventListener("message", handler);
          reject(e.data.error);
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "fetchGmtByUrl", payload: { url } });
    });
  };

  const fetchGmtByLibrary = (library) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 메인 스레드에서 직접 fetch (CORS 제약이 적음)
        let gmtUrl = "";
        if (library === "WikiPathways") {
          // 여러 URL 옵션 시도 (다양한 출처와 버전)
          // 참고: WikiPathways 데이터는 정기적으로 업데이트되므로 URL이 변경될 수 있습니다
          const urls = [
            // Enrichr API를 통한 GMT 다운로드 (더 안정적)
            "https://maayanlab.cloud/Enrichr/geneSetLibrary?mode=text&libraryName=WikiPathways_2021_Human",
            "https://maayanlab.cloud/Enrichr/geneSetLibrary?mode=text&libraryName=WikiPathways_2019_Human",
            // WikiPathways 직접 다운로드 (다양한 날짜)
            "https://wikipathways-data.wmcloud.org/current/gmt/wikipathways-20240510-gmt-Homo_sapiens.gmt",
            "https://wikipathways-data.wmcloud.org/current/gmt/wikipathways-20240310-gmt-Homo_sapiens.gmt",
            "https://wikipathways-data.wmcloud.org/current/gmt/wikipathways-20231210-gmt-Homo_sapiens.gmt",
            // GitHub raw (백업)
            "https://raw.githubusercontent.com/wikipathways/wikipathways-data/main/current/gmt/wikipathways-20240510-gmt-Homo_sapiens.gmt",
            "https://raw.githubusercontent.com/wikipathways/wikipathways-data/main/current/gmt/wikipathways-20240310-gmt-Homo_sapiens.gmt"
          ];
          
          let lastError = null;
          for (const url of urls) {
            try {
              const response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'text/plain',
                },
                mode: 'cors',
                cache: 'no-cache'
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const gmtText = await response.text();
              
              if (!gmtText || gmtText.trim().length === 0) {
                throw new Error("GMT 파일이 비어있습니다");
              }

              resolve(gmtText);
              return;
            } catch (err) {
              lastError = err;
              console.warn(`Failed to fetch from ${url}:`, err.message);
              // 다음 URL 시도
              continue;
            }
          }
          
          // 모든 URL 실패
          reject(new Error(`모든 URL에서 GMT 파일을 가져올 수 없습니다. 마지막 오류: ${lastError?.message || '알 수 없는 오류'}`));
          return;
        } else {
          reject(new Error(`알 수 없는 라이브러리: ${library}`));
          return;
        }
      } catch (err) {
        reject(new Error(`GMT 로드 실패: ${err.message}`));
      }
    });
  };

  const plotORABar = () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        workerRef.current.removeEventListener("message", handler);
        reject(new Error("plotORABar 타임아웃 (60초)"));
      }, 60000);
      const handler = (e) => {
        if (e.data.type === "plotORABar-result") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          resolve(e.data.image);
        }
        if (e.data.type === "plotORABar-error") {
          clearTimeout(timeout);
          workerRef.current.removeEventListener("message", handler);
          reject(new Error(e.data.error));
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "plotORABar" });
    });
  };

  return { ready, runPython, setData, setHeatmap, setExpr, setGeneSets, setGroupInfo, plotVolcano, plotHeatmap, plotSsGSEAHeatmap, plotPathwayCorr, fetchGmtByUrl, fetchGmtByLibrary, plotORABar };
}