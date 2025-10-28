import { ensureLogCPM } from "./common";
import { capturePlot } from "../core/plotCapture";

export async function handlePCA({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef
}) {
  setStatus("PCA 실행 중");
  try {
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요");
      return;
    }

    await ensureLogCPM(webR, logCPMReadyRef, setStatus);

    await capturePlot(
      webR,
      `
      grp <- as.factor(samples[[ "${groupCol}" ]])

      pca <- prcomp(t(logCPM))

      plot(
        pca$x[,1],
        pca$x[,2],
        col=grp,
        pch=19,
        xlab="PC1",
        ylab="PC2",
        main=paste("PCA by", "${groupCol}")
      )

      legend(
        "topright",
        legend=levels(grp),
        col=1:length(levels(grp)),
        pch=19,
        bty="n"
      )
      `,
      "PCA",
      setStatus
    );

    setStatus("PCA 완료");
  } catch (err) {
    setStatus("PCA 오류 " + err.message);
  }
}