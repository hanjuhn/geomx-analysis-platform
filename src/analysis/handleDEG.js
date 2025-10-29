import { ensureLogCPM } from "./common"
import { capturePlot } from "../core/plotCapture"
import { evalRToString } from "../core/webRInit"

export async function handleDEG({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef,
  setDegGenes,
}) {
  setStatus("DEG 실행 중")
  try {
    // QC 체크
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요")
      return
    }

    // logCPM 생성 보장
    await ensureLogCPM(webR, logCPMReadyRef, setStatus)

    /* =============================
       1) Volcano
    ============================= */
    await capturePlot(
      webR,
      `
      g <- as.factor(samples[[ "${groupCol}" ]])
      if (length(unique(g)) < 2) {
        plot.new(); text(0.5,0.5,"그룹이 두 개 미만",cex=1.4)
      } else {
        lv <- levels(g)

        # 디자인 매트릭스
        design <- model.matrix(~ 0 + g)
        colnames(design) <- lv

        # 선형 적합
        fit <- lm.fit(design, t(logCPM))
        coef <- t(fit$coefficients)

        contrast <- c(-1,1)
        logFC <- coef %*% contrast
        rownames(logFC) <- rownames(logCPM)

        # 분산
        resid <- t(logCPM) - fit$fitted.values
        s2 <- apply(resid,2,var)
        s2_pooled <- mean(s2)
        df <- ncol(logCPM) - ncol(design)

        # 통계값
        tstat <- logFC / sqrt(s2_pooled / length(g))
        pval <- 2 * pt(-abs(tstat), df=df)
        adj <- p.adjust(pval, method="BH")

        # 기준
        thrFC <- 1
        thrFDR <- 0.05
        sig <- (adj < thrFDR) & (abs(logFC) > thrFC)

        # =============================
        # Top30 DEG 계산
        # =============================
        sig_genes <- rownames(logCPM)[sig]

        if (length(sig_genes) > 0) {

          df_sig <- data.frame(
            gene = sig_genes,
            adj = adj[sig],
            logFC = logFC[sig],
            stringsAsFactors = FALSE
          )

          # adj 기준 정렬
          df_sig <- df_sig[order(df_sig$adj), ]

          topn <- min(30, nrow(df_sig))
          top30 <- df_sig$gene[1:topn]

          assign("top30_genes", top30, envir=.GlobalEnv)

          cat("---- Top 30 Significant DEG ----\\n")
          print(top30)

        } else {
          assign("top30_genes", character(0), envir=.GlobalEnv)
          cat("유의한 DEG 없음\\n")
        }

        # volcano
        plot(
          x=logFC,
          y=-log10(adj),
          pch=19,
          cex=0.55,
          col=ifelse(sig,"red","grey"),
          xlab="log2 Fold Change",
          ylab="-log10(FDR)",
          main=paste("Volcano Plot","${groupCol}",lv[1],"vs",lv[2])
        )
        abline(v=c(-thrFC,thrFC), col="blue", lty=2)
        abline(h=-log10(thrFDR), col="blue", lty=2)
      }
      `,
      "DEG_Volcano",
      setStatus
    )


    /* =============================
      JS 로 Top30 가져오기
    ============================= */
    let top30List = []
    try {
      const out = await evalRToString(webR, `
        if (exists("top30_genes")) {
          paste(top30_genes, collapse="\\n")
        } else {
          ""
        }
      `)

      if (out && out.trim().length > 0) {
        top30List = out.trim().split("\n")
      }
    } catch (e) {
      console.log("top30_genes 불러오기 실패", e)
    }

    if (setDegGenes) {
      setDegGenes(top30List)
    }


    /* =============================
      3) Heatmap (Top20 + row/col clustering)
    ============================= */
    await capturePlot(
      webR,
      `
      g <- as.factor(samples[[ "${groupCol}" ]])

      if (length(unique(g)) >= 2) {

        lv <- levels(g)
        design <- model.matrix(~ 0 + g)
        colnames(design) <- lv

        fit <- lm.fit(design, t(logCPM))
        coef <- t(fit$coefficients)

        contrast <- c(-1,1)
        logFC <- coef %*% contrast

        resid <- t(logCPM) - fit$fitted.values
        s2 <- apply(resid,2,var)
        s2_pooled <- mean(s2)
        df <- ncol(logCPM) - ncol(design)

        tstat <- logFC / sqrt(s2_pooled / length(g))
        pval <- 2 * pt(-abs(tstat), df=df)
        adj <- p.adjust(pval, method="BH")

        ord <- order(adj, decreasing=FALSE)
        topn <- min(20, length(ord))
        genes <- rownames(logCPM)[ord][1:topn]

        ## 1) matrix
        mat <- logCPM[genes, , drop=FALSE]

        ## 2) z-score scaling (gene-wise)
        mat <- t(scale(t(mat)))

        ## 3) row/column distance + clustering
        row_dist <- dist(mat)
        row_clust <- hclust(row_dist, method="ward.D2")
        row_order <- row_clust$order

        col_dist <- dist(t(mat))
        col_clust <- hclust(col_dist, method="ward.D2")
        col_order <- col_clust$order

        ## 4) 재정렬
        mat2 <- mat[row_order, col_order, drop=FALSE]
        genes_ord <- rownames(mat2)
        samples_ord <- samples$SegmentDisplayName[col_order]

        ## 5) heatmap
        image(
          x=1:ncol(mat2),
          y=1:nrow(mat2),
          z=t(mat2[nrow(mat2):1,]),
          col=colorRampPalette(c("blue","white","red"))(50),
          axes=FALSE,
          main=paste("Top 20 DEG Heatmap","${groupCol}")
        )

        # x축
        axis(1, at=1:ncol(mat2), labels=samples_ord, las=2, cex.axis=0.6)

        # y축
        axis(2, at=1:nrow(mat2), labels=rev(genes_ord), las=2, cex.axis=0.7)

        box()

      } else {
        plot.new(); text(0.5,0.5,"그룹이 두 개 미만",cex=1.4)
      }
      `,
      "DEG_Heatmap",
      setStatus
    )

    setStatus("DEG 완료")

  } catch (err) {
    setStatus("DEG 오류 " + err.message)
  }
}