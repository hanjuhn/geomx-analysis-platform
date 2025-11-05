// volcano.js

function handleVolcanoMessage(event) {
    if (event.data.type !== "plotVolcano") return
  
    if (!self._data) {
      postMessage({
        type: "plotVolcano-error",
        error: "CSV 데이터가 설정되지 않음"
      })
      return
    }
  
    try {
      const code = `
  import pandas as pd
  import io
  import numpy as np
  import matplotlib
  matplotlib.use("Agg")
  import matplotlib.pyplot as plt
  import matplotlib.patheffects as pe
  import base64
  import js
  
  csv_text = js._data
  df = pd.read_csv(io.StringIO(csv_text))
  
  if "wil_p" not in df.columns or "logFC" not in df.columns:
      raise ValueError("CSV에 wil_p 또는 logFC가 없음")
  
  # Benjamini–Hochberg FDR
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
  
  q = p_adjust_bh(np.array(df["wil_p"].replace([np.inf,-np.inf], np.nan).fillna(1.0).astype(float)))
  df["FDR"] = q
  df["negLog10FDR"] = -np.log10(np.where(q<=0, np.nan, q))
  
  thrFC = 1.0
  thrQ = 0.05
  
  sign_q = (df["FDR"].replace([np.inf, -np.inf], np.nan) < thrQ)
  sign_fc = (np.abs(df["logFC"].astype(float)) > thrFC)
  sig_both = (sign_q & sign_fc)
  up = (sig_both & (df["logFC"].astype(float) > 0))
  down = (sig_both & (df["logFC"].astype(float) < 0))
  
  colors = np.where(up, "#ff7f00", np.where(down, "#c71585", "#cfd8dc"))
  sizes = np.where(sig_both, 14, 8)
  
  fig, ax = plt.subplots(figsize=(7.5, 5), dpi=110)
  ax.scatter(df["logFC"], df["negLog10FDR"], c=colors, s=sizes, alpha=0.85, linewidths=0)
  
  # threshold lines
  ax.axvline(x=-thrFC, color="#6a1b9a", linestyle="--", linewidth=1)
  ax.axvline(x=thrFC, color="#6a1b9a", linestyle="--", linewidth=1)
  ax.axhline(y=0.0, color="#9e9e9e", linestyle="--", linewidth=1)
  
  ax.set_xlabel("log2 Fold Change")
  ax.set_ylabel("log10 FDR")
  ax.set_title("Volcano Plot")
  
  try:
      df['gene'] = df.iloc[:, 0].astype(str) if 'gene' not in df.columns else df['gene'].astype(str)
  except Exception:
      df['gene'] = df.iloc[:, 0].astype(str)
  
  top_k = 12
  min_gap = 0.6
  y_max = float(df['negLog10FDR'].max())
  x_min = float(df['logFC'].min())
  x_max = float(df['logFC'].max())
  
  def place_labels(side_df, is_right):
      side_df = side_df.sort_values('negLog10FDR', ascending=False).head(top_k)
      placed_y = []
      for _, r in side_df.iterrows():
          y_base = float(r['negLog10FDR']) + 0.4
          y_lab = y_base
          ok = False
          tries = 0
          while not ok and tries < 200:
              ok = all(abs(y_lab - py) >= min_gap for py in placed_y)
              if not ok:
                  y_lab += min_gap
              tries += 1
          placed_y.append(y_lab)
          x_lab = x_max + 0.2 if is_right else x_min - 0.2
          color = "#000000"
          ha = 'right' if is_right else 'left'
          ax.annotate(
              r['gene'],
              xy=(float(r['logFC']), float(r['negLog10FDR'])),
              xytext=(x_lab, y_lab),
              fontsize=7,
              color=color,
              ha=ha,
              va='center',
              path_effects=[pe.withStroke(linewidth=1.5, foreground='white')],
              arrowprops=dict(
                  arrowstyle='-',
                  color='#000000',
                  lw=0.8,
                  shrinkA=0,
                  shrinkB=0,
                  connectionstyle='angle3,angleA=0,angleB=90'
              )
          )
  
  place_labels(df[up].copy(), is_right=True)
  place_labels(df[down].copy(), is_right=False)
  fig.tight_layout()
  
  import io as _io
  buf = _io.BytesIO()
  fig.savefig(buf, format="png")
  buf.seek(0)
  b64 = base64.b64encode(buf.read()).decode("ascii")
  buf.close()
  b64
      `
  
      if (!self.pyodide) {
        postMessage({
          type: "plotVolcano-error",
          error: "Pyodide가 초기화되지 않았습니다"
        })
        return
      }

      self.pyodide.runPythonAsync(code)
        .then((b64) => {
          postMessage({
            type: "plotVolcano-result",
            image: b64
          })
        })
        .catch((err) => {
          postMessage({
            type: "plotVolcano-error",
            error: err.toString()
          })
        })
  
    } catch (err) {
      postMessage({
        type: "plotVolcano-error",
        error: err.toString()
      })
    }
  }