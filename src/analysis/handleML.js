import { ensureLogCPM } from "./common";
import { capturePlot } from "../core/plotCapture";

export async function handleML({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef
}) {
  setStatus("ML 분류 실행 중");
  try {
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요");
      return;
    }
    await ensureLogCPM(webR, logCPMReadyRef, setStatus);

    await capturePlot(webR, `
      X <- t(logCPM)
      y <- as.factor(samples$${groupCol})

      gini_impurity <- function(labels) {
        p <- table(labels) / length(labels)
        1 - sum(p^2)
      }

      best_split <- function(X, y, features) {
        best_feat <- NULL
        best_thr <- NULL
        best_gini <- Inf
        for (f in features) {
          xvals <- X[, f]
          thr_candidates <- unique(quantile(xvals, probs = seq(0.1, 0.9, 0.1)))
          for (thr in thr_candidates) {
            left <- y[xvals <= thr]
            right <- y[xvals > thr]
            if (length(left) == 0 || length(right) == 0) next
            gini <- (length(left)*gini_impurity(left) + length(right)*gini_impurity(right)) / length(y)
            if (gini < best_gini) {
              best_gini <- gini
              best_feat <- f
              best_thr <- thr
            }
          }
        }
        list(feature = best_feat, threshold = best_thr)
      }

      build_tree <- function(X, y, depth = 1, max_depth = 3, mtry = NULL) {
        if (length(unique(y)) == 1 || depth > max_depth) {
          return(list(pred = names(which.max(table(y)))))
        }
        if (is.null(mtry)) mtry <- max(1, floor(sqrt(ncol(X))))
        features <- sample(1:ncol(X), mtry)
        split <- best_split(X, y, features)
        if (is.null(split$feature)) {
          return(list(pred = names(which.max(table(y)))))
        }
        feat <- split$feature
        thr <- split$threshold
        left_idx <- X[, feat] <= thr
        right_idx <- !left_idx
        node <- list(feature = feat, threshold = thr)
        node$left <- build_tree(X[left_idx, , drop=FALSE], y[left_idx], depth+1, max_depth, mtry)
        node$right <- build_tree(X[right_idx, , drop=FALSE], y[right_idx], depth+1, max_depth, mtry)
        node
      }

      predict_tree <- function(tree, X) {
        if (!is.null(tree$pred)) return(rep(tree$pred, nrow(X)))
        feat <- tree$feature
        thr <- tree$threshold
        left_idx <- X[, feat] <= thr
        preds <- rep(NA, nrow(X))
        preds[left_idx] <- predict_tree(tree$left, X[left_idx, , drop=FALSE])
        preds[!left_idx] <- predict_tree(tree$right, X[!left_idx, , drop=FALSE])
        preds
      }

      set.seed(123)
      n_tree <- 30
      forest <- list()
      n_sample <- floor(nrow(X) * 0.8)
      for (t in 1:n_tree) {
        idx <- sample(1:nrow(X), n_sample, replace = TRUE)
        Xb <- X[idx, , drop=FALSE]
        yb <- y[idx]
        forest[[t]] <- build_tree(Xb, yb, max_depth = 3)
      }

      pred_matrix <- sapply(forest, function(tr) predict_tree(tr, X))
      pred_final <- apply(pred_matrix, 1, function(row) names(which.max(table(row))))
      acc <- mean(pred_final == y)

      cm <- table(True=y, Pred=pred_final)
      cm_prop <- prop.table(cm, 1)

      image(1:ncol(cm_prop), 1:nrow(cm_prop), t(cm_prop[nrow(cm_prop):1,]),
            col=colorRampPalette(c("white","skyblue","blue"))(50),
            axes=FALSE, main=paste("Confusion Matrix RF-like\\nAccuracy:", round(acc*100,2), "%"))
      axis(1, at=1:ncol(cm_prop), labels=colnames(cm_prop), las=2)
      axis(2, at=1:nrow(cm_prop), labels=rev(rownames(cm_prop)), las=2)
      for (i in 1:nrow(cm_prop)) {
        for (j in 1:ncol(cm_prop)) {
          val <- round(cm_prop[nrow(cm_prop)-i+1,j]*100,1)
          text(j, i, paste0(val,"%"), cex=0.8)
        }
      }
      box()
    `, "ML_RF", setStatus);

    setStatus("ML 분류 완료");
  } catch (err) {
    setStatus("ML 분류 오류 " + err.message);
  }
}