// handlePathway.js

export async function handleSsGSEA({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef,
  pyodide,
  gmtText,
  setGmtText,
  defaultGmtLibrary,
  ensurePyodideReady,
  exportExprCsv
}) {
  try {
    setStatus("ssGSEA 준비 중");
    const ok = await ensurePyodideReady();
    if (!ok) { setStatus("Pyodide 준비 실패"); return; }

    // Auto-fetch GMT if not loaded; use local variable to avoid async state race
    let gmt = gmtText;
    if (!gmt || gmt.trim().length === 0) {
      try {
        setStatus("GMT 로드 중... (Enrichr → WikiPathways 직접 다운로드 시도 중)");
        gmt = await pyodide.fetchGmtByLibrary(defaultGmtLibrary);
        setGmtText(gmt);
        setStatus("GMT 로드 완료");
      } catch (e) {
        setStatus(`GMT 자동 로드 실패: ${e.message}. GMT 파일을 직접 업로드하거나 URL을 입력해주세요.`);
        console.error("GMT 로드 오류:", e);
        return;
      }
    }

    // 전체 유전자 사용: GSEA는 DEG 필터 없이 실행
    setStatus("표현행렬 추출 중...");
    const exprCsv = await exportExprCsv(null);
    if (!exprCsv || exprCsv.trim().length === 0) { setStatus("표현행렬 없음"); return; }

    // 그룹 정보 추출 (샘플별 groupCol 값)
    setStatus("그룹 정보 추출 중...");
    const groupInfo = await (async () => {
      try {
          const code = `{
          smp <- samples$SegmentDisplayName
          grp <- if ("${groupCol}" %in% colnames(samples)) samples[["${groupCol}"]]
                 else rep("Group", length(smp))
          paste(smp, grp, sep="=", collapse=",")
        }`;
        const res = await webR.evalR(code);
        const txt = await res.toString();
        return txt.split(',').reduce((acc, pair) => {
          const [samp, grp] = pair.split('=');
          acc[samp.trim()] = grp.trim();
          return acc;
        }, {});
      } catch (e) {
        return {};
      }
    })();

    setStatus("데이터 전송 중...");
    await pyodide.setExpr(exprCsv.trim());
    await pyodide.setGeneSets(gmt.trim());
    await pyodide.setGroupInfo(JSON.stringify({ groupCol, groups: groupInfo }));

    setStatus("ssGSEA Heatmap 생성 중...");
    const b64 = await pyodide.plotSsGSEAHeatmap();
    const el = document.getElementById('plot_SSGSEA_Heatmap');
    if (el) el.innerHTML = `<img src="data:image/png;base64,${b64}" style="max-width:860px;border:1px solid #ddd;border-radius:6px;margin:14px 0"/>`;
    setStatus("ssGSEA Heatmap 완료");
  } catch (e) {
    setStatus("ssGSEA 오류 " + e);
    console.error("ssGSEA error:", e);
  }
}

export async function handlePathwayCorr({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef,
  pyodide,
  gmtText,
  setGmtText,
  defaultGmtLibrary,
  ensurePyodideReady,
  exportExprCsv,
  getDegGenesSafe
}) {
  try {
    setStatus("Pathway Corr 준비 중");
    const ok = await ensurePyodideReady();
    if (!ok) { setStatus("Pyodide 준비 실패"); return; }

    // Auto-fetch GMT if not loaded; use local variable to avoid async state race
    let gmt = gmtText;
    if (!gmt || gmt.trim().length === 0) {
      try {
        gmt = await pyodide.fetchGmtByLibrary(defaultGmtLibrary);
        setGmtText(gmt);
      } catch (e) {
        setStatus("GMT 자동 로드 실패 " + e);
        return;
      }
    }

    const degList = await getDegGenesSafe();
    if (!degList || degList.length === 0) { setStatus("DEG 먼저 실행 필요"); return; }
    const exprCsv = await exportExprCsv(degList);
    if (!exprCsv || exprCsv.trim().length === 0) { setStatus("표현행렬 없음"); return; }

    // 그룹 정보 추출 (histology용)
    // Types 컬럼이 있으면 우선 사용, 없으면 groupCol 사용
    const groupInfo = await (async () => {
      try {
        const code = `{
          smp <- samples$SegmentDisplayName
          grp_col <- NULL
          if ("Types" %in% colnames(samples)) {
            grp_col <- "Types"
          } else if ("${groupCol}" %in% colnames(samples)) {
            grp_col <- "${groupCol}"
          } else {
            grp_col <- NULL
          }
          if (!is.null(grp_col)) {
            grp <- samples[[grp_col]]
          } else {
            grp <- rep("Group", length(smp))
          }
          paste(smp, grp, sep="=", collapse=",")
        }`;
        const res = await webR.evalR(code);
        const txt = await res.toString();
        return txt.split(',').reduce((acc, pair) => {
          const [samp, grp] = pair.split('=');
          acc[samp.trim()] = grp.trim();
          return acc;
        }, {});
      } catch (e) {
        return {};
      }
    })();

    // Segment 정보 추출 (PanCK/Vimentin 분리용)
    const segmentInfo = await (async () => {
      try {
        // Segment 컬럼 찾기 (여러 가능한 이름 시도)
        const code = `{
          smp <- samples$SegmentDisplayName
          seg_col <- NULL
          if ("Segment" %in% colnames(samples)) {
            seg_col <- samples$Segment
          } else if ("SegmentDisplayName" %in% colnames(samples)) {
            seg_col <- samples$SegmentDisplayName
          } else {
            seg_col <- smp
          }
          paste(smp, seg_col, sep="=", collapse=",")
        }`;
        const res = await webR.evalR(code);
        const txt = await res.toString();
        return txt.split(',').reduce((acc, pair) => {
          const [samp, seg] = pair.split('=');
          acc[samp.trim()] = seg.trim();
          return acc;
        }, {});
      } catch (e) {
        console.warn('Segment 정보 추출 실패:', e);
        return {};
      }
    })();

    await pyodide.setExpr(exprCsv.trim());
    await pyodide.setGeneSets(gmt.trim());
    await pyodide.setGroupInfo(JSON.stringify({ groupCol, groups: groupInfo, segments: segmentInfo }));

    setStatus("Pathway Corr 생성 중");
    const b64 = await pyodide.plotPathwayCorr();
    const el = document.getElementById('plot_Pathway_Corr');
    if (el) el.innerHTML = `<img src="data:image/png;base64,${b64}" style="max-width:860px;border:1px solid #ddd;border-radius:6px;margin:14px 0"/>`;
    setStatus("Pathway Corr 완료");
  } catch (e) {
    setStatus("Pathway Corr 오류 " + e);
  }
}

export async function handleORABar({
  webR,
  setStatus,
  pyodide,
  gmtText,
  setGmtText,
  defaultGmtLibrary,
  ensurePyodideReady
}) {
  try {
    setStatus("ORA Bar 준비 중");
    const ok = await ensurePyodideReady();
    if (!ok) { setStatus("Pyodide 준비 실패"); return; }

    // Auto-fetch GMT
    let gmt = gmtText;
    if (!gmt || gmt.trim().length === 0) {
      try {
        setStatus("GMT 로드 중...");
        gmt = await pyodide.fetchGmtByLibrary(defaultGmtLibrary);
        setGmtText(gmt);
        setStatus("GMT 로드 완료");
      } catch (e) { 
        setStatus(`GMT 자동 로드 실패: ${e.message}`); 
        return; 
      }
    }

    // DEG CSV 데이터 가져오기 (volcano plot용 데이터)
    setStatus("DEG 데이터 확인 중...");
    try {
      const degCsv = await webR.evalR(`if (exists("txt_wilcox_csv")) txt_wilcox_csv else ""`);
      const degCsvText = await degCsv.toString();
      if (!degCsvText || degCsvText.trim().length === 0) {
        setStatus("DEG 먼저 실행 필요 (Volcano plot 데이터 없음)");
        return;
      }
      await pyodide.setData(degCsvText.trim());
    } catch (e) {
      setStatus("DEG 데이터 가져오기 실패 " + e);
      return;
    }

    // GMT 설정
    await pyodide.setGeneSets(gmt.trim());

    setStatus("ORA 분석 및 Bar plot 생성 중...");
    const b64 = await pyodide.plotORABar();
    const el = document.getElementById('plot_ORA_Bar');
    if (el) el.innerHTML = `<img src="data:image/png;base64,${b64}" style="max-width:860px;border:1px solid #ddd;border-radius:6px;margin:14px 0"/>`;
    setStatus("ORA Bar 완료");
  } catch (e) {
    setStatus("ORA Bar 오류 " + e);
    console.error("ORA Bar error:", e);
  }
}

