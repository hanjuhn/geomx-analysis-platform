// corr.js

function handleCorrMessage(event) {
    if (event.data.type !== "plotPathwayCorr") return
  
    if (!self._expr || !self._gmt || !self._groupInfo) {
      postMessage({
        type: "plotPathwayCorr-error",
        error: "표현형/GMT/그룹정보 필요"
      })
      return
    }
  
    try {
      const code = `
  import pandas as pd, numpy as np, io, base64, json
  from scipy.stats import spearmanr
  import matplotlib
  matplotlib.use('Agg')
  import matplotlib.pyplot as plt
  import js
  
  expr = pd.read_csv(io.StringIO(js._expr))
  expr = expr.set_index(expr.columns[0])
  
  gmt_text = js._gmt
  genesets = {}
  for line in gmt_text.splitlines():
      parts = line.strip().split('\\t')
      if len(parts) >= 3:
          genesets[parts[0]] = [g for g in parts[2:] if g]
  
  genesets_use = genesets
  
  group_info = json.loads(js._groupInfo)
  groups_dict = group_info.get('groups', {})
  segments_dict = group_info.get('segments', {})
  
  # ssGSEA (rank-mean) score
  ranks = expr.rank(axis=0, method='average')
  ranks.index = ranks.index.astype(str)
  genes = set(ranks.index)
  pathway_scores = []
  pathway_names = []
  for pname, glist in genesets_use.items():
      gset = [g for g in glist if g in genes]
      if len(gset) == 0:
          continue
      sc = ranks.loc[gset].mean(axis=0)
      pathway_scores.append(sc.values)
      pathway_names.append(pname)
  if len(pathway_scores) == 0:
      raise ValueError('유효한 패스웨이가 없음 (교집합 0)')
  scores = pd.DataFrame(np.vstack(pathway_scores), index=pathway_names, columns=ranks.columns)
  
  # 샘플
  sample_names = [str(s).strip() for s in scores.columns]
  scores.columns = sample_names
  
  # histology → ordinal
  histology_str = []
  segments_arr = []
  for s in sample_names:
      hv = groups_dict.get(s, '')
      if not hv:
          for k, v in groups_dict.items():
              if str(k).strip() in s or s in str(k).strip():
                  hv = v
                  break
      histology_str.append(str(hv))
  
      sv = segments_dict.get(s, '')
      if not sv:
          for k, v in segments_dict.items():
              if str(k).strip() in s or s in str(k).strip():
                  sv = v
                  break
      segments_arr.append(str(sv))
  
  unique_hist = sorted(set([h for h in histology_str if h and h != '']))
  if len(unique_hist) == 0:
      raise ValueError('Histology 정보 없음')
  histology_map = {h:i for i, h in enumerate(unique_hist)}
  histology_ordinal = np.array([histology_map.get(h, 0) if h and h!='' else 0 for h in histology_str])
  
  # segment mask
  segments_lower = [str(s).lower() for s in segments_arr]
  panck_mask = np.array([
      'panck' in s or 'pan' in s or 'epithelial' in s or 'epi' in s
      for s in segments_lower
  ])
  vim_mask = np.array([
      'vimentin' in s or 'vim' in s or 'mesenchymal' in s or 'mes' in s
      for s in segments_lower
  ])
  
  panck_count = int(panck_mask.sum())
  vim_count   = int(vim_mask.sum())
  
  # variation check
  unique_hist_panck = set(histology_ordinal[panck_mask])
  unique_hist_vim   = set(histology_ordinal[vim_mask])
  overall_has_variation = len(unique_hist) > 1
  
  if not overall_has_variation:
      raise ValueError(f'전체 Histology variation 부족: unique histology={unique_hist}')
  
  results = []
  for idx, pname in enumerate(scores.index):
      path_scores = scores.iloc[idx].values
  
      # PanCK
      panck_scores = path_scores[panck_mask]
      hist_for_panck = histology_ordinal[panck_mask]
      unique_hist_p = set(hist_for_panck)
      has_hist_variation_p = len(unique_hist_p) > 1
  
      if len(panck_scores) >= 3 and has_hist_variation_p:
          try:
              rho_p, p_p = spearmanr(panck_scores, hist_for_panck)
              if np.isnan(rho_p) or np.isnan(p_p):
                  rho_p, p_p = 0.0, 1.0
              n_p = len(panck_scores)
              if n_p > 3:
                  z_p = 0.5 * np.log((1+rho_p)/(1-rho_p+1e-10))
                  se_p = 1.0 / np.sqrt(n_p - 3)
                  ci_low_p  = np.tanh(z_p - 1.96*se_p)
                  ci_high_p = np.tanh(z_p + 1.96*se_p)
              else:
                  ci_low_p = ci_high_p = rho_p
              sig_p = p_p < 0.05
          except:
              rho_p, ci_low_p, ci_high_p, sig_p, p_p = 0.0, 0.0, 0.0, False, 1.0
      else:
          rho_p, ci_low_p, ci_high_p, sig_p, p_p = np.nan, np.nan, np.nan, False, 1.0
  
      # Vimentin
      vim_scores = path_scores[vim_mask]
      hist_for_vim = histology_ordinal[vim_mask]
      unique_hist_v = set(hist_for_vim)
      has_hist_variation_v = len(unique_hist_v) > 1
  
      if len(vim_scores) >= 3 and has_hist_variation_v:
          try:
              rho_v, p_v = spearmanr(vim_scores, hist_for_vim)
              if np.isnan(rho_v) or np.isnan(p_v):
                  rho_v, p_v = 0.0, 1.0
              n_v = len(vim_scores)
              if n_v > 3:
                  z_v = 0.5 * np.log((1+rho_v)/(1-rho_v+1e-10))
                  se_v = 1.0 / np.sqrt(n_v - 3)
                  ci_low_v  = np.tanh(z_v - 1.96*se_v)
                  ci_high_v = np.tanh(z_v + 1.96*se_v)
              else:
                  ci_low_v = ci_high_v = rho_v
              sig_v = p_v < 0.05
          except:
              rho_v, ci_low_v, ci_high_v, sig_v, p_v = 0.0, 0.0, 0.0, False, 1.0
      else:
          rho_v, ci_low_v, ci_high_v, sig_v, p_v = np.nan, np.nan, np.nan, False, 1.0
  
      results.append({
          'pathway': pname,
          'panck_rho': rho_p, 'panck_ci_low': ci_low_p, 'panck_ci_high': ci_high_p, 'panck_sig': sig_p,
          'vim_rho':   rho_v, 'vim_ci_low':   ci_low_v, 'vim_ci_high':   ci_high_v, 'vim_sig':  sig_v
      })
  
  def get_max_abs_rho(r):
      rho_p = r['panck_rho'] if not np.isnan(r['panck_rho']) else 0.0
      rho_v = r['vim_rho']   if not np.isnan(r['vim_rho'])   else 0.0
      return max(abs(rho_p), abs(rho_v))
  
  results_valid = [r for r in results if not (np.isnan(r['panck_rho']) and np.isnan(r['vim_rho']))]
  if len(results_valid) == 0:
      raise ValueError('모든 pathway에서 correlation 계산 불가')
  
  results_sorted = sorted(results_valid, key=get_max_abs_rho, reverse=True)[:20]
  results_sorted.reverse()
  
  fig, ax = plt.subplots(figsize=(7.5, 8.5), dpi=120)
  y_pos = np.arange(len(results_sorted))
  
  for i, r in enumerate(results_sorted):
      y = y_pos[i]
  
      # PanCK
      if not np.isnan(r['panck_rho']):
          x_p = r['panck_rho']
          xerr_p_low  = x_p - r['panck_ci_low']
          xerr_p_high = r['panck_ci_high'] - x_p
          ls_p = '-' if r['panck_sig'] else '--'
          ax.errorbar(
              x_p, y, xerr=[[xerr_p_low], [xerr_p_high]],
              fmt='o', color='#ff7f00', markersize=6,
              linewidth=1.5, capsize=3, linestyle=ls_p
          )
  
      # Vimentin
      if not np.isnan(r['vim_rho']):
          x_v = r['vim_rho']
          xerr_v_low  = x_v - r['vim_ci_low']
          xerr_v_high = r['vim_ci_high'] - x_v
          ls_v = '-' if r['vim_sig'] else '--'
          ax.errorbar(
              x_v, y, xerr=[[xerr_v_low], [xerr_v_high]],
              fmt='o', color='#c71585', markersize=6,
              linewidth=1.5, capsize=3, linestyle=ls_v
          )
  
  # x=0 baseline
  ax.axvline(x=0, color='gray', linewidth=1.5, linestyle='-', alpha=0.5)
  
  ax.set_yticks(y_pos)
  ax.set_yticklabels([r['pathway'] for r in results_sorted], fontsize=7)
  ax.set_ylim(-0.5, len(results_sorted)-0.5)
  ax.set_xlabel("Spearman's correlation coefficient", fontsize=9)
  ax.set_xlim(-1.1, 1.1)
  ax.set_xticks([-1, -0.5, 0, 0.5, 1])
  ax.grid(axis='x', alpha=0.3)
  
  # 방향 라벨
  y_label = len(results_sorted) + 0.3
  ax.annotate('Decreasing', xy=(-0.85, y_label), xytext=(-0.95, y_label),
             fontsize=8, ha='left', va='bottom',
             arrowprops=dict(arrowstyle='<-', color='black', lw=1))
  ax.annotate('Increasing', xy=(0.85, y_label), xytext=(0.95, y_label),
             fontsize=8, ha='right', va='bottom',
             arrowprops=dict(arrowstyle='->', color='black', lw=1))
  
  from matplotlib.lines import Line2D
  leg_elements = [
      Line2D([0], [0], color='black', linewidth=1.5, linestyle='-',  label='Significant'),
      Line2D([0], [0], color='black', linewidth=1.5, linestyle='--', label='Non-significant'),
      Line2D([0], [0], color='#ff7f00', marker='o', linestyle='None', markersize=6, label='PanCK'),
      Line2D([0], [0], color='#c71585', marker='o', linestyle='None', markersize=6, label='Vimentin')
  ]
  ax.legend(handles=leg_elements, loc='lower right', fontsize=8, framealpha=0.9)
  
  ax.set_title('Pathway Spearman Correlation', fontsize=10, pad=12)
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
          type: "plotPathwayCorr-error",
          error: "Pyodide가 초기화되지 않았습니다"
        })
        return
      }

      self.pyodide.runPythonAsync(code).then((b64) => {
        postMessage({
          type: "plotPathwayCorr-result",
          image: b64
        })
      }).catch((err) => {
        postMessage({
          type: "plotPathwayCorr-error",
          error: err.toString()
        })
      })
    } catch (err) {
      postMessage({
        type: "plotPathwayCorr-error",
        error: err.toString()
      })
    }
  }