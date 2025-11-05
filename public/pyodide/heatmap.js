// heatmap.js

function handleHeatmapMessage(event) {
    if (event.data.type !== "plotHeatmap") return
  
    if (!self._heatmap) {
      postMessage({
        type: "plotHeatmap-error",
        error: "Heatmap CSV가 없음"
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
  import base64
  import js
  
  csv_text = js._heatmap
  df = pd.read_csv(io.StringIO(csv_text))
  
  if df.shape[1] < 2:
      raise ValueError("Heatmap CSV 형식 오류")
  
  genes = df.iloc[:,0].astype(str).tolist()
  mat = df.iloc[:,1:].to_numpy(dtype=float)
  
  fig, ax = plt.subplots(figsize=(7.5, 5.2), dpi=110)
  im = ax.imshow(mat, aspect='auto', cmap='bwr', interpolation='nearest')
  
  ax.set_xticks(np.arange(mat.shape[1]))
  ax.set_xticklabels(df.columns[1:], rotation=90, fontsize=6)
  
  ax.set_yticks(np.arange(mat.shape[0]))
  ax.set_yticklabels(genes, fontsize=7)
  
  plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
  ax.set_title('Top DEG Heatmap (z-scored)')
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
          type: "plotHeatmap-error",
          error: "Pyodide가 초기화되지 않았습니다"
        })
        return
      }

      self.pyodide.runPythonAsync(code).then((b64) => {
        postMessage({
          type: "plotHeatmap-result",
          image: b64
        })
      }).catch((err) => {
        postMessage({
          type: "plotHeatmap-error",
          error: err.toString()
        })
      })
  
    } catch (err) {
      postMessage({
        type: "plotHeatmap-error",
        error: err.toString()
      })
    }
  }