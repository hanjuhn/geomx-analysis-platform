import { evalRVoid } from "../core/webRInit";

/** logCPM 생성 보장 */
export async function ensureLogCPM(webR, logCPMReadyRef, setStatus) {
  if (logCPMReadyRef.current) return;
  setStatus("정규화 logCPM 수행 중");
  try {
    await evalRVoid(webR, `
      libsize <- colSums(counts)
      norm_counts <- sweep(counts, 2, libsize / mean(libsize), "/")
      logCPM <- log2((norm_counts / colSums(norm_counts)) * 1e6 + 1)
    `);
    logCPMReadyRef.current = true;
    setStatus("정규화 완료");
  } catch (err) {
    setStatus("정규화 오류: " + err.message);
    throw err;
  }
}