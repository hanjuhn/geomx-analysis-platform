import { ensureLogCPM } from "./common";
import { capturePlot } from "../core/plotCapture";

export async function handleDEG({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef
}) {
  setStatus("DEG 실행 중");
  try {
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요");
      return;
    }
    await ensureLogCPM(webR, logCPMReadyRef, setStatus);

    await capturePlot(webR, `
      g <- as.factor(samples$${groupCol})
      if (length(unique(g)) < 2) {
        plot.new(); text(0.5,0.5,"그룹이 두 개 미만", cex=1.4)
      } else {
        lv <- levels(g)
        design <- model.matrix(~ 0 + g)
        colnames(design) <- lv

        meanExpr <- rowMeans(logCPM)
        varExpr <- apply(logCPM, 1, var)
        weight <- 1 / (varExpr + 1e-6)
        W <- diag(weight)

        fit <- lm.fit(design, t(logCPM))
        coef <- t(fit$coefficients)

        contrast <- c(-1, 1)
        logFC <- coef %*% contrast
        rownames(logFC) <- rownames(logCPM)

        resid <- t(logCPM) - fit$fitted.values
        s2 <- apply(resid, 2, var)
        s2_pooled <- mean(s2)
        df <- ncol(logCPM) - ncol(design)
        tstat <- logFC / sqrt(s2_pooled / length(g))
        pval <- 2 * pt(-abs(tstat), df=df)
        adj <- p.adjust(pval, method="BH")

        thrFC <- 1
        thrFDR <- 0.05
        sig <- (adj < thrFDR) & (abs(logFC) > thrFC)
        plot(logFC, -log10(adj),
             pch=19, cex=0.55, col=ifelse(sig,"red","grey"),
             xlab="log2 Fold Change", ylab="-log10(FDR)",
             main=paste("Volcano limma 유사", "${groupCol}", lv[1], "vs", lv[2]))
        abline(v=c(-thrFC, thrFC), col="blue", lty=2)
        abline(h=-log10(thrFDR), col="blue", lty=2)
      }
    `, "DEG_Volcano", setStatus);

    await capturePlot(webR, `
      g <- as.factor(samples$${groupCol})
      if (length(unique(g)) >= 2) {
        lv <- levels(g)
        design <- model.matrix(~ 0 + g)
        colnames(design) <- lv

        fit <- lm.fit(design, t(logCPM))
        coef <- t(fit$coefficients)
        contrast <- c(-1, 1)
        logFC <- coef %*% contrast
        resid <- t(logCPM) - fit$fitted.values
        s2 <- apply(resid, 2, var)
        s2_pooled <- mean(s2)
        df <- ncol(logCPM) - ncol(design)
        tstat <- logFC / sqrt(s2_pooled / length(g))
        pval <- 2 * pt(-abs(tstat), df=df)
        adj <- p.adjust(pval, method="BH")

        ord <- order(adj, decreasing=FALSE)
        topn <- min(20, length(ord))
        genes <- rownames(logCPM)[ord][1:topn]
        mat <- logCPM[genes, , drop=FALSE]
        mat <- t(scale(t(mat)))
        image(1:ncol(mat), 1:nrow(mat),
              t(mat[nrow(mat):1, ]),
              col=colorRampPalette(c("blue","white","red"))(50),
              axes=FALSE, main=paste("Top 20 DEG Heatmap", "${groupCol}"))
        axis(1, at=1:ncol(mat), labels=samples$SegmentDisplayName, las=2, cex.axis=0.6)
        axis(2, at=1:nrow(mat), labels=rev(genes), las=2, cex.axis=0.7)
        box()
      } else {
        plot.new(); text(0.5,0.5,"그룹이 두 개 미만", cex=1.4)
      }
    `, "DEG_Heatmap", setStatus);

    setStatus("DEG 완료");
  } catch (err) {
    setStatus("DEG 오류 " + err.message);
  }
}