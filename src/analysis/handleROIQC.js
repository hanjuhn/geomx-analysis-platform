import { evalRToString, evalRVoid } from "../core/webRInit";
import { capturePlot } from "../core/plotCapture";

export async function handleROIQC({
  webR,
  setStatus,
  roiThreshold,
  setRoiKept,
  setRoiTotal,
  qcAppliedRef
}) {
  setStatus("ROI QC 실행 중");
  try {
    const res = await evalRToString(webR, `
      thr <- ${roiThreshold}
      keep <- samples$AOINucleiCount > thr
      paste(sum(keep), length(keep))
    `);
    const [keptStr, totalStr] = res.trim().split(" ");
    const kept = parseInt(keptStr, 10);
    const total = parseInt(totalStr, 10);
    setRoiKept(kept);
    setRoiTotal(total);

    await capturePlot(webR, `
      pass <- samples$AOINucleiCount > ${roiThreshold}
      barplot(samples$AOINucleiCount,
              col=ifelse(pass,"darkgreen","tomato"),
              main="ROI QC AOINucleiCount > ${roiThreshold}",
              ylab="AOINucleiCount", xlab="ROI index")
      abline(h=${roiThreshold}, col="blue", lty=2)
      legend("topright",
             legend=c(paste0("kept ", sum(pass)), paste0("drop ", length(pass)-sum(pass))),
             fill=c("darkgreen","tomato"), bty="n")
    `, "QC_ROI", setStatus);

    await evalRVoid(webR, `
      keep <- samples$AOINucleiCount > ${roiThreshold}
      counts <- counts[, keep, drop=FALSE]
      samples <- samples[keep, , drop=FALSE]
    `);

    qcAppliedRef.current.roi = true;
    setStatus("ROI QC 완료");
  } catch (err) {
    setStatus("ROI QC 오류 " + err.message);
  }
}