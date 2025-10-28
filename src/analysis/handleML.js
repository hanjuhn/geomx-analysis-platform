import { ensureLogCPM } from "./common";
import { capturePlot } from "../core/plotCapture";

/**
 * handleML()
 * ------------------------------------------------
 * WebR 기반 RandomForest-like ML Classification
 * - ROI / Gene QC 완료 후 logCPM 기반 분류 실행
 * - 80/20 Train-Test Split 적용 (재현 가능성 보장)
 * - 테스트셋 정확도 및 혼동행렬 시각화
 * ------------------------------------------------
 */
export async function handleML({
  webR,
  setStatus,
  groupCol,
  qcAppliedRef,
  logCPMReadyRef
}) {
  setStatus("ML 분류 실행 중");

  try {
    // QC 체크
    if (!qcAppliedRef.current.roi || !qcAppliedRef.current.gene) {
      setStatus("QC 먼저 실행 필요");
      return;
    }

    // logCPM 정규화 확인
    await ensureLogCPM(webR, logCPMReadyRef, setStatus);

    // R 코드 실행
    await capturePlot(
      webR,
      `
      # =============================
      # 1. 데이터 준비 및 분할
      # =============================
      X <- t(logCPM)
      y <- as.factor(samples$${groupCol})
      set.seed(123)

      n <- nrow(X)
      train_idx <- sample(1:n, floor(0.8 * n))
      test_idx  <- setdiff(1:n, train_idx)

      X_train <- X[train_idx, , drop=FALSE]
      y_train <- y[train_idx]
      X_test  <- X[test_idx, , drop=FALSE]
      y_test  <- y[test_idx]

      # =============================
      # 2. 지니 불순도 함수
      # =============================
      gini_impurity <- function(labels) {
        p <- table(labels) / length(labels)
        1 - sum(p^2)
      }

      # =============================
      # 3. 최적 분할 탐색 함수
      # =============================
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

      # =============================
      # 4. 트리 빌드 함수
      # =============================
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

      # =============================
      # 5. 예측 함수
      # =============================
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

      # =============================
      # 6. 랜덤포레스트 학습 (Train)
      # =============================
      set.seed(123)
      n_tree <- 30
      forest <- list()
      n_sample <- floor(nrow(X_train) * 0.8)
      for (t in 1:n_tree) {
        idx <- sample(1:nrow(X_train), n_sample, replace = TRUE)
        Xb <- X_train[idx, , drop=FALSE]
        yb <- y_train[idx]
        forest[[t]] <- build_tree(Xb, yb, max_depth = 3)
      }

      # =============================
      # 7. 테스트셋 예측
      # =============================
      pred_matrix <- sapply(forest, function(tr) predict_tree(tr, X_test))
      pred_final <- apply(pred_matrix, 1, function(row) names(which.max(table(row))))
      acc <- mean(pred_final == y_test)

      cm <- table(True=y_test, Pred=pred_final)
      cm_prop <- prop.table(cm, 1)

      # =============================
      # 8. 혼동행렬 시각화
      # =============================
      image(1:ncol(cm_prop), 1:nrow(cm_prop), t(cm_prop[nrow(cm_prop):1,]),
            col=colorRampPalette(c("white","skyblue","blue"))(50),
            axes=FALSE, 
            main=paste("Confusion Matrix\\nAccuracy:", round(acc*100,2), "%"))

      axis(1, at=1:ncol(cm_prop), labels=colnames(cm_prop), las=2)
      axis(2, at=1:nrow(cm_prop), labels=rev(rownames(cm_prop)), las=2)

      for (i in 1:nrow(cm_prop)) {
        for (j in 1:ncol(cm_prop)) {
          val <- round(cm_prop[nrow(cm_prop)-i+1,j]*100,1)
          text(j, i, paste0(val,"%"), cex=0.8)
        }
      }
      box()
      `,
      "ML_RF",
      setStatus
    );

    setStatus("ML 분류 완료 (Train/Test Split 적용)");
  } catch (err) {
    setStatus("ML 분류 오류 " + err.message);
  }
}