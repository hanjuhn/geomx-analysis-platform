import { evalRToString } from "../core/webRInit";
import { capturePlot } from "../core/plotCapture";

export async function handleGeneQC({
  webR,
  setStatus,
  minCount,
  sampleFraction,
  detectFraction,
  setGeneKept,
  setGeneTotal,
  qcAppliedRef
}) {
  setStatus("Gene QC 실행 중");
  try {
    const rCode = `
      min_count <- ${minCount}
      sample_fraction <- ${sampleFraction}
      detect_fraction <- ${detectFraction}

      if ("ProbeType" %in% colnames(features)) {
        neg_idx <- which(features$ProbeType %in% c("NegProbe","Negative"))
        if (length(neg_idx) > 0) {
          neg_mat <- as.matrix(counts[neg_idx, , drop=FALSE])
          gmean <- function(x) exp(mean(log(pmax(x, 1))))
          gsd   <- function(x) exp(sd(log(pmax(x, 1))))
          loq_vec <- apply(neg_mat, 2, function(x) gmean(x) * (gsd(x)^2))
        } else {
          loq_vec <- rep(1, ncol(counts))
        }
      } else {
        loq_vec <- rep(1, ncol(counts))
      }

      detect_mat <- sweep(counts, 2, loq_vec, ">")
      detect_rate <- rowMeans(detect_mat, na.rm=TRUE)

      keep_min   <- rowMeans(counts >= min_count, na.rm=TRUE) >= sample_fraction
      keep_loq   <- detect_rate >= detect_fraction
      keep_final <- keep_min & keep_loq

      kept  <- sum(keep_final, na.rm=TRUE)
      total <- nrow(counts)
      counts <- counts[keep_final, , drop=FALSE]
      paste(kept, total)
    `;
    const res = await evalRToString(webR, rCode);
    const [keptStr, totalStr] = res.trim().split(" ");
    const kept = parseInt(keptStr, 10);
    const total = parseInt(totalStr, 10);
    setGeneKept(kept);
    setGeneTotal(total);

    await capturePlot(webR, `
      sel <- if(nrow(counts) > 200) sample(1:nrow(counts), 200) else 1:nrow(counts)
      boxplot(log2(counts[sel,] + 1),
              las=2, col="gray",
              main=paste0("Gene QC with LOQ filtering ", ${kept}, "/", ${total}, " kept"),
              ylab="log2(count + 1)")
    `, "QC_Gene", setStatus);

    qcAppliedRef.current.gene = true;
    setStatus("Gene QC 완료");
  } catch (err) {
    setStatus("Gene QC 오류 " + err.message);
  }
}