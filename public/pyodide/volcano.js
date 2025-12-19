function handleVolcanoMessage(event) {
  if (event.data.type !== "plotVolcano") return;

  if (!self._data) {
    postMessage({
      type: "plotVolcano-error",
      error: "CSV 데이터가 설정되지 않음"
    });
    return;
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

# ==========================================================
# 1) 데이터 로드
# ==========================================================
csv_text = js._data
df = pd.read_csv(io.StringIO(csv_text))

required = {"logFC", "wil_p"}
if not required.issubset(df.columns):
    raise ValueError("CSV에 logFC 또는 wil_p 없음")

try:
    df["gene"] = df["gene"].astype(str)
except:
    df["gene"] = df.iloc[:, 0].astype(str)

# ==========================================================
# 2) FDR 계산
# ==========================================================
def p_adjust_bh(p):
    p = np.asfarray(p)
    n = p.size
    order = np.argsort(p)
    ranked = np.arange(1, n + 1)
    q = p * n / ranked[order]
    q_sorted = np.minimum.accumulate(q[::-1])[::-1]
    q[order] = q_sorted
    return np.minimum(q, 1.0)

df["FDR"] = p_adjust_bh(
    df["wil_p"].replace([np.inf, -np.inf], np.nan).fillna(1.0)
)
df["neglog10p"] = -np.log10(df["wil_p"].replace([0], np.nan))

# ==========================================================
# 3) DEG 필터링
# ==========================================================
thrFC = 1.0
thrQ = 0.05

sig = (df["FDR"] < thrQ) & (df["logFC"].abs() > thrFC)
up = sig & (df["logFC"] > 0)
down = sig & (df["logFC"] < 0)

# ==========================================================
# 4) 색상 및 plot 설정
# ==========================================================
COLOR_UP = "#8b2f2f"
COLOR_DOWN = "#89aee8"
COLOR_NOSIG = "#d3d3d3"

colors = np.where(up, COLOR_UP,
          np.where(down, COLOR_DOWN, COLOR_NOSIG))
sizes = np.where(sig, 60, 30)

plt.rcParams["figure.facecolor"] = "white"
plt.rcParams["font.size"] = 22

fig, ax = plt.subplots(figsize=(18, 12), dpi=160)

ax.scatter(
    df["logFC"], df["neglog10p"],
    c=colors, s=sizes, alpha=0.9, linewidths=0
)

ax.set_xlabel("logFC", fontsize=36)
ax.set_ylabel("-log10(p-value)", fontsize=36)
ax.tick_params(labelsize=30)

# ==========================================================
# 5) 라벨 배치
# ==========================================================
YLIM_TOP = df["neglog10p"].max()
LABEL_START_Y = YLIM_TOP - 3.0
LABEL_VSPACE = 1.9

xmin, xmax = df["logFC"].min(), df["logFC"].max()
x_left = xmin + 0.3
x_right = xmax - 0.3

TOP_K = 5
top_up = df[up].sort_values("neglog10p", ascending=False).head(TOP_K)
top_down = df[down].sort_values("neglog10p", ascending=False).head(TOP_K)

def place_labels_inline(rows, x_fixed, align):
    cur_y = LABEL_START_Y
    for _, r in rows.iterrows():
        label_y = cur_y
        cur_y -= LABEL_VSPACE

        if align == "right":
            ax.text(
                x_fixed, label_y, r["gene"],
                fontsize=24, ha="left", va="center"
            )
            ax.plot(
                [r["logFC"], x_fixed],
                [r["neglog10p"], label_y],
                color="black", linewidth=2.0
            )
        else:
            ax.text(
                x_fixed, label_y, r["gene"],
                fontsize=24, ha="right", va="center"
            )
            ax.plot(
                [x_fixed, r["logFC"]],
                [label_y, r["neglog10p"]],
                color="black", linewidth=2.0
            )

place_labels_inline(top_down, x_left, "left")
place_labels_inline(top_up, x_right, "right")

# ==========================================================
# 6) 범례
# ==========================================================
from matplotlib.lines import Line2D

legend_elems = [
    Line2D([0],[0], marker='o', color='w',
           markerfacecolor=COLOR_DOWN, markersize=18, label='Down'),
    Line2D([0],[0], marker='o', color='w',
           markerfacecolor=COLOR_NOSIG, markersize=18, label='Not Sig'),
    Line2D([0],[0], marker='o', color='w',
           markerfacecolor=COLOR_UP, markersize=18, label='Up')
]

ax.legend(
    handles=legend_elems,
    loc="upper left",
    bbox_to_anchor=(1.05, 1.0),
    fontsize=22,
    frameon=True
)

# ==========================================================
# 7) 레이아웃
# ==========================================================
fig.tight_layout(rect=[0.05, 0.05, 0.82, 0.97])
ax.set_position([0.08, 0.09, 0.78, 0.83])

# ==========================================================
# 8) Base64 Export
# ==========================================================
import io as _io
buf = _io.BytesIO()
fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=1.2)
buf.seek(0)
b64 = base64.b64encode(buf.read()).decode()
buf.close()

b64
    `;

    if (!self.pyodide) {
      postMessage({
        type: "plotVolcano-error",
        error: "Pyodide가 초기화되지 않았습니다"
      });
      return;
    }

    self.pyodide.runPythonAsync(code)
      .then((b64) => {
        postMessage({
          type: "plotVolcano-result",
          image: b64
        });
      })
      .catch((err) => {
        postMessage({
          type: "plotVolcano-error",
          error: err.toString()
        });
      });

  } catch (err) {
    postMessage({
      type: "plotVolcano-error",
      error: err.toString()
    });
  }
}