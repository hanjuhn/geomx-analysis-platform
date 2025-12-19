import { ensureLogCPM } from "./common"
import { capturePlot } from "../core/plotCapture"

export async function handlePCA({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef
}) {
  setStatus("PCA 실행 중")
  try {
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요")
      return
    }

    await ensureLogCPM(webR, logCPMReadyRef, setStatus)

    await capturePlot(
      webR,
      `
      grp <- as.factor(samples[[ "${groupCol}" ]])
      pca <- prcomp(t(logCPM))

      # ===== margin 충분히 확장 =====
      par(mar = c(6, 7, 4.5, 2))

      plot(
        pca$x[,1],
        pca$x[,2],
        col = grp,
        pch = 19,
        xlab = "PC1",
        ylab = "PC2",
        main = paste("PCA by", "${groupCol}"),
        cex = 1.8,
        cex.lab = 2.2,
        cex.axis = 1.9,
        cex.main = 2.3
      )

      legend(
        "topright",
        legend = levels(grp),
        col = seq_along(levels(grp)),
        pch = 19,
        bty = "n",
        cex = 1.9
      )
      `,
      "PCA",
      setStatus
    )

    setStatus("PCA 완료")
  } catch (err) {
    setStatus("PCA 오류 " + err.message)
  }
}