// enrichBar.js

function handleEnrichBarMessage(event) {
    if (event.data.type !== "plotORABar") return
  
    if (!self._data || !self._gmt) {
      postMessage({
        type: "plotORABar-error",
        error: "DEG CSV 또는 GMT 필요 (DEG 먼저 실행 필요)"
      })
      return
    }
  
    try {
      const code = `
  import pandas as pd, numpy as np, io, base64, json
  import matplotlib
  matplotlib.use('Agg')
  import matplotlib.pyplot as plt
  import pyodide_http
  pyodide_http.patch_all()
  import requests
  import js
  
  # =========
  # 1) DEG CSV 읽기
  # =========
  csv_text = js._data
  df = pd.read_csv(io.StringIO(csv_text))
  
  required = {"gene", "logFC", "wil_p", "wil_FDR"}
  if not required.issubset(df.columns):
      raise ValueError("CSV must contain: gene logFC wil_p wil_FDR")
  
  df["gene"] = df["gene"].astype(str).str.upper()
  
  # =========
  # 2) 기준 정의
  # =========
  logfc_thr = 1.0
  fdr_thr   = 0.05
  
  # up / down mask
  up_mask   = (df["logFC"] >  logfc_thr) & (df["wil_FDR"] < fdr_thr)
  down_mask = (df["logFC"] < -logfc_thr) & (df["wil_FDR"] < fdr_thr)
  
  up_genes   = df.loc[up_mask,   "gene"].unique().tolist()
  down_genes = df.loc[down_mask, "gene"].unique().tolist()
  
  # fallback
  if len(up_genes) == 0:
      up_genes = df.sort_values("wil_FDR")["gene"].head(200).tolist()
  if len(down_genes) == 0:
      down_genes = df.sort_values("wil_FDR")["gene"].head(200).tolist()
  
  # =========
  # 3) WikiPathways GMT 파싱
  # =========
  gmt_text = js._gmt
  genesets = {}
  for line in gmt_text.splitlines():
      parts = line.strip().split('\\t')
      if len(parts) >= 3:
          genesets[parts[0]] = [g.upper() for g in parts[2:] if g]
  
  # WikiPathways 라이브러리 찾기 (GMT 파일에서)
  wp_pathways = list(genesets.keys())
  if len(wp_pathways) == 0:
      raise RuntimeError("WikiPathways pathway가 없습니다")
  
  # =========
  # 4) ORA 함수 (수동 구현: Fisher's exact test)
  # =========
  def run_ORA(gene_list, pathway_genesets, background_genes):
      from scipy.stats import fisher_exact
      
      gene_set = set([g.upper() for g in gene_list])
      n_background = len(background_genes)
      n_in_list = len(gene_set & background_genes)
      
      if n_in_list == 0:
          return None
      
      results = []
      
      for pname, pathway_genes in pathway_genesets.items():
          pathway_set = set([g.upper() for g in pathway_genes])
          
          # 교집합
          overlap = gene_set & pathway_set
          k = len(overlap)
          
          if k == 0:
              continue
          
          # Fisher's exact test
          # contingency table: [[a, b], [c, d]]
          # a = overlap (in pathway AND in gene list)
          # b = in pathway but NOT in gene list
          # c = in gene list but NOT in pathway
          # d = neither in pathway nor in gene list
          n_pathway = len(pathway_set & background_genes)
          
          a = k
          b = n_pathway - k
          c = n_in_list - k
          d = n_background - n_pathway - n_in_list + k
          
          if a < 0 or b < 0 or c < 0 or d < 0:
              continue
          
          if a + b == 0 or a + c == 0:
              continue
          
          try:
              oddsratio, pval = fisher_exact([[a, b], [c, d]], alternative='greater')
          except:
              continue
          
          results.append({
              'Term': pname,
              'Overlap': k,
              'P-value': pval,
              'Adjusted P-value': 1.0,  # 나중에 BH로 조정
              'Odds Ratio': oddsratio
          })
      
      if len(results) == 0:
          return None
      
      res_df = pd.DataFrame(results)
      
      # Benjamini-Hochberg FDR 조정
      def p_adjust_bh(p):
          p = np.asfarray(p)
          n = p.size
          if n == 0:
              return p
          order = np.argsort(p)
          ranked = np.empty(n, float); ranked[order] = np.arange(1, n+1)
          q = p * n / ranked
          q_sorted = q[order]
          q_sorted = np.minimum.accumulate(q_sorted[::-1])[::-1]
          q[order] = q_sorted
          return np.minimum(q, 1.0)
      
      res_df['Adjusted P-value'] = p_adjust_bh(res_df['P-value'].values)
      res_df = res_df.sort_values('Adjusted P-value', ascending=True)
      
      return res_df
  
  # 배경 유전자 집합 (GMT의 모든 유전자)
  background_genes = set()
  for pathway_genes in genesets.values():
      background_genes.update([g.upper() for g in pathway_genes])
  
  # =========
  # 5) ORA 실행: UP + DOWN
  # =========
  res_up = run_ORA(up_genes, genesets, background_genes)
  res_down = run_ORA(down_genes, genesets, background_genes)
  
  # =========
  # 6) barplot 함수
  # =========
  def plot_res(res, title, ax):
      if res is None or len(res) == 0:
          ax.text(0.5, 0.5, f'{title} plot 없음', ha='center', va='center', fontsize=12)
          ax.axis('off')
          return
      
      top = res.head(min(15, len(res))).copy()
      top['neglog10_adjP'] = -np.log10(top['Adjusted P-value'].astype(float) + 1e-300)
      top = top.sort_values('neglog10_adjP', ascending=False)  # 큰 값부터 정렬
      
      y_pos = np.arange(len(top))
      ax.barh(
          y_pos,
          top['neglog10_adjP'],
          color='#a6cee3',
          edgecolor='black'
      )
      
      ax.set_yticks(y_pos)
      ax.set_yticklabels(top['Term'], fontsize=8)
      ax.set_xlabel('-log10(Adjusted P-value)', fontsize=9)
      ax.set_ylabel('Term', fontsize=9)
      ax.set_title(title, fontsize=11, pad=10)
      ax.grid(axis='x', linestyle='--', alpha=0.4)
      ax.invert_yaxis()
  
  # =========
  # 7) Plot — 두 개 출력
  # =========
  fig, axes = plt.subplots(1, 2, figsize=(20, 10), dpi=120)
  
  plot_res(res_up, 'Vimentin+ enriched pathways (WikiPathways)', axes[0])
  plot_res(res_down, 'PanCK+ enriched pathways (WikiPathways)', axes[1])
  
  fig.tight_layout(pad=2.0)
  
  import io as _io
  buf = _io.BytesIO()
  fig.savefig(buf, format='png', bbox_inches='tight', dpi=120, facecolor='white')
  buf.seek(0)
  b64 = base64.b64encode(buf.read()).decode('ascii')
  buf.close()
  b64
      `
  
      if (!self.pyodide) {
        postMessage({
          type: "plotORABar-error",
          error: "Pyodide가 초기화되지 않았습니다"
        })
        return
      }

      self.pyodide.runPythonAsync(code).then((b64) => {
        postMessage({
          type: "plotORABar-result",
          image: b64
        })
      }).catch((err) => {
        postMessage({
          type: "plotORABar-error",
          error: err.toString()
        })
      })
  
    } catch (err) {
      postMessage({
        type: "plotORABar-error",
        error: err.toString()
      })
    }
  }