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

      # AOINucleiCount 존재 여부 확인
      if (!"AOINucleiCount" %in% colnames(samples) || all(is.na(samples$AOINucleiCount))) {
        effective_nuclei <- colMeans(counts, na.rm=TRUE)
      } else {
        effective_nuclei <- samples$AOINucleiCount
      }

      keep <- effective_nuclei > thr
      paste(sum(keep), length(keep))
    `)

    const parts = res.trim().split(" ")
    const kept = parseInt(parts[0], 10)
    const total = parseInt(parts[1], 10)

    setRoiKept(kept)
    setRoiTotal(total)

    await capturePlot(
      webR,
      `
        thr <- ${roiThreshold}

        if (!"AOINucleiCount" %in% colnames(samples) || all(is.na(samples$AOINucleiCount))) {
          effective_nuclei <- colMeans(counts, na.rm=TRUE)
          label_main <- "ROI QC colMeans(counts) > ${roiThreshold}"
        } else {
          effective_nuclei <- samples$AOINucleiCount
          label_main <- "ROI QC AOINucleiCount > ${roiThreshold}"
        }

        pass <- effective_nuclei > thr

        barplot(effective_nuclei,
                col=ifelse(pass,"darkgreen","tomato"),
                main=label_main,
                ylab="value", xlab="ROI index")
        abline(h=thr, col="blue", lty=2)

        legend("topright",
               legend=c(paste0("kept ", sum(pass)), paste0("drop ", length(pass)-sum(pass))),
               fill=c("darkgreen","tomato"), bty="n")
      `,
      "QC_ROI",
      setStatus
    )

    await evalRVoid(webR, `
      thr <- ${roiThreshold}

      if (!"AOINucleiCount" %in% colnames(samples) || all(is.na(samples$AOINucleiCount))) {
        effective_nuclei <- colMeans(counts, na.rm=TRUE)
      } else {
        effective_nuclei <- samples$AOINucleiCount
      }

      keep <- effective_nuclei > thr
      counts <- counts[, keep, drop=FALSE]
      samples <- samples[keep, , drop=FALSE]
    `)

    qcAppliedRef.current.roi = true
    setStatus("ROI QC 완료")
    
  } catch (err) {
    setStatus("ROI QC 오류 " + err.message)
  }
}