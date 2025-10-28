import { evalRToString, evalRVoid } from "./webRInit";

/** 브라우저 파일을 R 가상 FS로 업로드 후 R 객체로 로드 */
export async function uploadFileToR(webR, file, rName) {
  const text = await file.text();
  const encoder = new TextEncoder();
  webR.FS.writeFile(`/tmp_${rName}.txt`, encoder.encode(text));
  await evalRVoid(
    webR,
    `${rName} <- read.table("/tmp_${rName}.txt", header=TRUE, sep="\\t", check.names=FALSE, quote="", comment.char="")`
  );
}

/** 메타데이터에서 분석 요인 컬럼 자동 선택 */
export async function discoverMetadataColumns(webR, setColumns, setGroupCol) {
  const raw = await evalRToString(webR, `
    if (!exists("samples")) {
      paste("", collapse="\\t")
    } else {
      cn <- colnames(samples)
      drop <- c("ROICoordinateX","ROICoordinateY","AOISurfaceArea","AOINucleiCount","SegmentIndex",
                "ScanWidth","ScanHeight","ScanOffsetX","ScanOffsetY","RawReads","AlignedReads",
                "DeduplicatedReads","SequencingSaturation","UMIQ30","RTSQ30","SequencingSetID",
                "GeoMxNgsPipelineVersion","ROIID","SegmentID","QCFlags")
      keep <- setdiff(cn, drop)
      paste(keep, collapse="\\t")
    }
  `);

  const cols = raw.split("\t").filter(Boolean);
  const preferred = ["NT_or_TC", "CD31", "Cirrhosis", "PatientID"];
  const ordered = [...preferred.filter(x => cols.includes(x)), ...cols.filter(x => !preferred.includes(x))];

  setColumns(ordered);
  if (ordered.length > 0) setGroupCol(ordered[0]);
}

/** 세 파일 업로드 후 counts samples features 정합 처리 및 총계 설정 */
export async function handleUploadAll({
  webR,
  files,
  setStatus,
  setRoiTotal,
  setRoiKept,
  setGeneTotal,
  setGeneKept,
  setColumns,
  setGroupCol,
  qcAppliedRef,
  logCPMReadyRef
}) {
  setStatus("데이터 로드 중");

  try {
    // 1) 파일 존재 여부 확인 후 개별 업로드
    if (files.count) await uploadFileToR(webR, files.count, "counts_raw");
    if (files.meta) await uploadFileToR(webR, files.meta, "samples");
    if (files.gene) await uploadFileToR(webR, files.gene, "features");

    // 2) R side: 존재하는 객체만 활용
    await evalRVoid(webR, `
      # 기본 NULL 설정
      if (!exists("counts_raw")) counts_raw <- NULL
      if (!exists("samples"))    samples    <- NULL
      if (!exists("features"))   features   <- NULL

      # counts 처리
      if (!is.null(counts_raw)) {
        counts <- counts_raw[,-1, drop=FALSE]
        rownames(counts) <- make.unique(counts_raw$TargetName)
      } else {
        counts <- NULL
      }

      # samples와 정합
      if (!is.null(counts) && !is.null(samples)) {
        roi_ids <- intersect(colnames(counts), samples$SegmentDisplayName)
        counts  <- counts[, roi_ids, drop=FALSE]
        samples <- samples[match(roi_ids, samples$SegmentDisplayName), , drop=FALSE]
        rownames(samples) <- samples$SegmentDisplayName
      }
    `);

    // 3) 개수 계산
    const totals = await evalRToString(webR, `
      roiTot <- if (exists("counts") && !is.null(counts)) ncol(counts) else 0
      geneTot <- if (exists("counts") && !is.null(counts)) nrow(counts) else 0
      paste(roiTot, geneTot)
    `);

    const [roiTot, geneTot] = totals.trim().split(" ").map(Number);

    setRoiTotal(roiTot);
    setRoiKept(roiTot);

    setGeneTotal(geneTot);
    setGeneKept(geneTot);

    // 4) 메타데이터 컬럼 자동 탐색
    await discoverMetadataColumns(webR, setColumns, setGroupCol);

    // 상태 초기화
    qcAppliedRef.current = { roi: false, gene: false };
    logCPMReadyRef.current = false;

    setStatus("데이터 로드 완료");

    const el = document.getElementById("plot_info");
    if (el)
      el.innerHTML = `
      <div style="padding:10px;border:1px solid #eee;border-radius:6px;background:#fafafa">
        데이터 로드 완료 이후 단계별 버튼 실행
      </div>`;
  } catch (err) {
    setStatus("데이터 로드 오류 " + err.message);
  }
}