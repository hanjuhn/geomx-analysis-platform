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
  pyodide,
}) {
  setStatus("DEG 실행 중")
  try {
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요")
      return
    }

    await ensureLogCPM(webR, logCPMReadyRef, setStatus)

    // 계산만 수행 (R volcano 그리기는 생략)
    await evalRToString(webR, `
      g <- as.factor(samples[[ "${groupCol}" ]])
      if (length(unique(g)) < 2) {
        assign("txt_wilcox_csv", "", envir=.GlobalEnv)
      } else {

        lv <- levels(g)

        design <- model.matrix(~ 0 + g)
        colnames(design) <- lv

        fit <- lm.fit(design, t(logCPM))
        coef <- t(fit$coefficients)

        contrast <- c(-1,1)
        logFC <- coef %*% contrast
        rownames(logFC) <- rownames(logCPM)

        resid <- t(logCPM) - fit$fitted.values
        s2 <- apply(resid,2,var)
        s2_pooled <- mean(s2)
        df <- ncol(logCPM) - ncol(design)

        tstat <- logFC / sqrt(s2_pooled / length(g))
        pval <- 2 * pt(-abs(tstat), df=df)
        adj <- p.adjust(pval, method="BH")

        thrFC <- 1
        thrFDR <- 0.05
        sig <- (adj < thrFDR) & (abs(logFC) > thrFC)

        sig_genes <- rownames(logCPM)[sig]

        if (length(sig_genes) > 0) {
          df_sig <- data.frame(
            gene = sig_genes,
            adj = adj[sig],
            logFC = logFC[sig],
            stringsAsFactors = FALSE
          )
          df_sig <- df_sig[order(df_sig$adj), ]
          topn <- min(30, nrow(df_sig))
          top30 <- df_sig$gene[1:topn]
          assign("top30_genes", top30, envir=.GlobalEnv)
        } else {
          assign("top30_genes", character(0), envir=.GlobalEnv)
        }

        ## ======================
        ## Wilcoxon
        ## ======================
        wil_p <- rep(NA_real_, nrow(logCPM))
        g1_idx <- which(g == lv[1])
        g2_idx <- which(g == lv[2])

        for (i in 1:nrow(logCPM)) {
          x1 <- as.numeric(logCPM[i, g1_idx])
          x2 <- as.numeric(logCPM[i, g2_idx])

          x1 <- x1[is.finite(x1)]
          x2 <- x2[is.finite(x2)]

          if (length(x1) < 1 || length(x2) < 1) {
            wil_p[i] <- NA_real_
            next
          }

          if (length(unique(c(x1, x2))) <= 1) {
            wil_p[i] <- 1.0
            next
          }

          tmp <- try(
            suppressWarnings(
              wilcox.test(x1, x2, alternative="two.sided", exact=FALSE, correct=TRUE)
            ),
            silent=TRUE
          )

          if (inherits(tmp, "try-error") || is.null(tmp$p.value) || !is.finite(tmp$p.value)) {
            wil_p[i] <- 1.0
          } else {
            wil_p[i] <- tmp$p.value
          }
        }

        wil_adj <- p.adjust(wil_p, method="BH")

        negLog10p <- rep(NA_real_, length(wil_p))
        ok <- which(is.finite(wil_p) & wil_p > 0)
        negLog10p[ok] <- -log10(wil_p[ok])

        deg_wilcox_df <- data.frame(
          gene = rownames(logCPM),
          logFC = as.numeric(logFC),
          wil_p = wil_p,
          wil_FDR = wil_adj,
          negLog10p = negLog10p,
          row.names=NULL
        )

        txt_wilcox_csv <- paste(
          paste(colnames(deg_wilcox_df), collapse=","),
          paste(apply(deg_wilcox_df,1,paste,collapse=","),collapse="\n"),
          sep="\n"
        )
        assign("txt_wilcox_csv", txt_wilcox_csv, envir=.GlobalEnv)
      }
    `)


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
    } catch (e) {}

    if (setDegGenes) {
      setDegGenes(top30List)
    }

      try {
      const csvText = await evalRToString(webR, `
        if (exists("txt_wilcox_csv")) txt_wilcox_csv else ""
      `)

      if (csvText && csvText.trim().length > 0) {
        const waitReady = async () => {
          const start = Date.now()
          while (!pyodide?.ready && Date.now() - start < 3000) {
            await new Promise(r => setTimeout(r, 100))
          }
          return !!pyodide?.ready
        }

        const isReady = await waitReady()
        if (isReady) {
          await pyodide.setData(csvText.trim())
          try {
            const b64 = await pyodide.plotVolcano()
            const el = document.getElementById(`plot_DEG_Volcano`)
            if (el) {
              el.innerHTML = `<img src="data:image/png;base64,${b64}" style="max-width:860px;border:1px solid #ddd;border-radius:6px;margin:14px 0"/>`
            }
          } catch (e) {
            console.error("Pyodide volcano error", e)
          }
        }
      }

    } catch (e) {
      // 에러 처리
      console.error("txt_wilcox_csv 전달 오류", e)
    }


    // Heatmap용 CSV 생성 (정렬/표준화 및 라벨 순서 포함)
    const heatmapCsv = await evalRToString(webR, `
      g <- as.factor(samples[[ "${groupCol}" ]])
      if (length(unique(g)) < 2) {
        ""
      } else {
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

        mat <- logCPM[genes, , drop=FALSE]
        mat <- t(scale(t(mat)))

        row_dist <- dist(mat)
        row_clust <- hclust(row_dist, method="ward.D2")
        row_order <- row_clust$order

        col_dist <- dist(t(mat))
        col_clust <- hclust(col_dist, method="ward.D2")
        col_order <- col_clust$order

        mat2 <- mat[row_order, col_order, drop=FALSE]
        genes_ord <- rownames(mat2)
        samples_ord <- samples$SegmentDisplayName[col_order]

        header <- paste(c("gene", samples_ord), collapse=",")
        body <- apply(mat2, 1, function(r) paste(format(r, trim=TRUE, scientific=FALSE), collapse=","))
        rows <- paste(genes_ord, body, sep=",")
        paste(header, paste(rows, collapse="\n"), sep="\n")
      }
    `)

    if (heatmapCsv && heatmapCsv.trim().length > 0) {
      const waitReady2 = async () => {
        const start = Date.now()
        while (!pyodide?.ready && Date.now() - start < 3000) {
          await new Promise(r => setTimeout(r, 100))
        }
        return !!pyodide?.ready
      }
      const ok = await waitReady2()
      if (ok) {
        await pyodide.setHeatmap(heatmapCsv.trim())
        try {
          const b64hm = await pyodide.plotHeatmap()
          const elhm = document.getElementById(`plot_DEG_Heatmap`)
          if (elhm) {
            elhm.innerHTML = `<img src="data:image/png;base64,${b64hm}" style="max-width:860px;border:1px solid #ddd;border-radius:6px;margin:14px 0"/>`
          }
        } catch (e) {
          console.error("Pyodide heatmap error", e)
        }
      }
    }

    setStatus("DEG 완료")

  } catch (err) {
    setStatus("DEG 오류 " + err.message)
  }
}