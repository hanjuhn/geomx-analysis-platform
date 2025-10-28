import { evalRToString, evalRVoid } from "./webRInit";

/** 브라우저 파일을 R 가상 FS로 업로드 후 R 객체로 로드 */
export async function uploadFileToR(webR, file, rName) {
  const text = await file.text();
  const encoder = new TextEncoder();
  webR.FS.writeFile(`/tmp_${rName}.txt`, encoder.encode(text));
  await evalRVoid(webR, `${rName} <- read.table("/tmp_${rName}.txt", header=TRUE, sep="\\t", check.names=FALSE, quote="", comment.char="")`);
}

/** 메타데이터에서 분석 요인 컬럼 자동 선택 */
export async function discoverMetadataColumns(webR, setColumns, setGroupCol) {
  const raw = await evalRToString(webR, `
    cn <- colnames(samples)
    drop <- c("ROICoordinateX","ROICoordinateY","AOISurfaceArea","AOINucleiCount","SegmentIndex",
              "ScanWidth","ScanHeight","ScanOffsetX","ScanOffsetY","RawReads","AlignedReads",
              "DeduplicatedReads","SequencingSaturation","UMIQ30","RTSQ30","SequencingSetID",
              "GeoMxNgsPipelineVersion","ROIID","SegmentID","QCFlags")
    keep <- setdiff(cn, drop)
    paste(keep, collapse="\\t")
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
    if (!files.count || !files.meta || !files.gene) throw new Error("세 파일 모두 업로드 필요");
    await uploadFileToR(webR, files.count, "counts_raw");
    await uploadFileToR(webR, files.meta, "samples");
    await uploadFileToR(webR, files.gene, "features");

    await evalRVoid(webR, `
      counts <- counts_raw[,-1]
      rownames(counts) <- make.unique(counts_raw$TargetName)
      roi_ids <- intersect(colnames(counts), samples$SegmentDisplayName)
      counts <- counts[, roi_ids, drop=FALSE]
      samples <- samples[match(roi_ids, samples$SegmentDisplayName), , drop=FALSE]
      rownames(samples) <- samples$SegmentDisplayName
    `);

    const totals = await evalRToString(webR, `paste(ncol(counts), nrow(counts))`);
    const [roiTot, geneTot] = totals.trim().split(" ").map(Number);
    setRoiTotal(roiTot);
    setRoiKept(roiTot);
    setGeneTotal(geneTot);
    setGeneKept(geneTot);

    await discoverMetadataColumns(webR, setColumns, setGroupCol);

    qcAppliedRef.current = { roi: false, gene: false };
    logCPMReadyRef.current = false;
    setStatus("데이터 로드 완료");

    const el = document.getElementById("plot_info");
    if (el) el.innerHTML = `<div style="padding:10px;border:1px solid #eee;border-radius:6px;background:#fafafa">데이터 로드 완료 이후 단계별 버튼 실행</div>`;
  } catch (err) {
    setStatus("데이터 로드 오류 " + err.message);
  }
}