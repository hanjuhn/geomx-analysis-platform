// ssGSEA.js

function handleSsGSEAMessage(event) {
  const t = event.data.type
  if (t !== "plotSsGSEAHeatmap" && t !== "plotSsGSEAImmune27") return

  if (!self._expr || !self._gmt) {
    postMessage({
      type: `${t}-error`,
      error: "표현형 또는 GMT가 없음"
    })
    return
  }

  try {
    const code = `
import pandas as pd, numpy as np, io, base64, json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import js

expr = pd.read_csv(io.StringIO(js._expr))
if expr.shape[1] < 2:
    raise ValueError('Expression CSV 형식 오류')
expr = expr.set_index(expr.columns[0])

group_info = None
try:
    if js._groupInfo:
        group_info = json.loads(js._groupInfo)
except:
    pass

gmt_text = js._gmt
genesets = {}
for line in gmt_text.splitlines():
    parts = line.strip().split('\\t')
    if len(parts) >= 3:
        genesets[parts[0]] = [g for g in parts[2:] if g]

ranks = expr.rank(axis=0, method='average')
ranks.index = ranks.index.astype(str)
genes = set(ranks.index)

pathway_scores = []
pathway_names = []
for pname, glist in genesets.items():
    gset = [g for g in glist if g in genes]
    if len(gset) == 0:
        continue
    sc = ranks.loc[gset].mean(axis=0)
    pathway_scores.append(sc.values)
    pathway_names.append(pname)

if len(pathway_scores) == 0:
    raise ValueError('유효한 패스웨이가 없음 (교집합 0)')

scores = pd.DataFrame(np.vstack(pathway_scores), index=pathway_names, columns=ranks.columns)
z = (scores.T - scores.T.mean())/scores.T.std(ddof=0)
z = z.T.fillna(0.0)

group_colors = None
group_labels = None
if group_info and 'groups' in group_info:
    groups_dict = group_info['groups']
    sample_groups = [(s, groups_dict.get(s, '')) for s in z.columns if s in groups_dict]
    sample_groups.sort(key=lambda x: (x[1], x[0]))
    ordered_samples = [s[0] for s in sample_groups]
    z = z[[c for c in ordered_samples if c in z.columns]]

    unique_groups = sorted(set([groups_dict.get(s, '') for s in z.columns]))
    import matplotlib.pyplot as plt
    try:
        cmap = plt.cm.get_cmap('Set3')
    except:
        cmap = plt.colormaps['Set3']

    colors_map = {}
    for i, grp in enumerate(unique_groups):
        if grp:
            colors_map[grp] = cmap(i % 12)

    group_colors = [colors_map.get(groups_dict.get(s, ''), '#95a5a6') for s in z.columns]
    group_labels = [groups_dict.get(s, '') for s in z.columns]

from scipy.spatial.distance import pdist
from scipy.cluster.hierarchy import linkage, fcluster
dists = pdist(z.values)
link = linkage(dists, method='ward')
clusters = fcluster(link, t=0.7*link[-2,2], criterion='distance')
cluster_order = np.argsort(clusters)
z = z.iloc[cluster_order]

boundaries = []
sorted_clusters = clusters[cluster_order]
for i in range(len(sorted_clusters)-1):
    if sorted_clusters[i] != sorted_clusters[i+1]:
        boundaries.append(i + 0.5)

if group_colors:
    fig = plt.figure(figsize=(8.0, 6.8), dpi=110)
    fig.suptitle('ssGSEA (WikiPathways) Heatmap', fontsize=11, y=0.995)
    gs = fig.add_gridspec(2, 1, height_ratios=[0.05, 0.95], hspace=0.12, top=0.95)
    ax_label = fig.add_subplot(gs[0])
    ax = fig.add_subplot(gs[1])
else:
    fig, ax = plt.subplots(figsize=(7.5, 5.8), dpi=110)

if group_colors:
    from matplotlib.patches import Rectangle
    for i, (col, grp) in enumerate(zip(group_colors, group_labels)):
        rect = Rectangle((i-0.5, -0.5), 1, 1, facecolor=col, edgecolor='black', linewidth=0.5)
        ax_label.add_patch(rect)
    ax_label.set_xlim(-0.5, len(group_colors)-0.5)
    ax_label.set_ylim(-0.5, 0.5)
    ax_label.axis('off')

    prev_grp = None
    for i, grp in enumerate(group_labels):
        if grp != prev_grp and grp:
            ax_label.text(
                i, 0, grp,
                ha='center', va='center', fontsize=7,
                bbox=dict(
                    boxstyle='round,pad=0.2',
                    facecolor='white', alpha=0.8,
                    edgecolor='black', linewidth=0.5
                )
            )
        prev_grp = grp

im = ax.imshow(z.to_numpy(), aspect='auto', cmap='RdBu_r', interpolation='nearest')
for b in boundaries:
    ax.axhline(y=b, color='white', linewidth=1.5, linestyle='-')

n_x = z.shape[1]
step_x = max(1, n_x // 20) if n_x > 20 else 1
ax.set_xticks(np.arange(0, n_x, step_x))
ax.set_xticklabels(
    [z.columns.tolist()[i] for i in range(0, n_x, step_x)],
    rotation=90, fontsize=5, ha='left'
)
ax.tick_params(axis='x', pad=2)

n_y = z.shape[0]
step_y = max(1, n_y // 30) if n_y > 30 else 1
ax.set_yticks(np.arange(0, n_y, step_y))
ax.set_yticklabels(
    [z.index.tolist()[i] for i in range(0, n_y, step_y)],
    fontsize=6
)

plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

if not group_colors:
    ax.set_title('ssGSEA (WikiPathways) Heatmap', pad=10)

if group_colors:
    fig.tight_layout(rect=[0.02, 0.02, 0.98, 0.98], pad=2.5)
else:
    fig.tight_layout(pad=2.0)

import io as _io
buf = _io.BytesIO()
fig.savefig(buf, format='png', bbox_inches='tight', dpi=110, facecolor='white')
buf.seek(0)
b64 = base64.b64encode(buf.read()).decode('ascii')
buf.close()
b64
    `

    if (!self.pyodide) {
      postMessage({
        type: `${t}-error`,
        error: "Pyodide가 초기화되지 않았습니다"
      })
      return
    }

    self.pyodide.runPythonAsync(code)
      .then((b64) => {
        postMessage({
          type: `${t}-result`,
          image: b64
        })
      })
      .catch((err) => {
        postMessage({
          type: `${t}-error`,
          error: err.toString()
        })
      })
  } catch (err) {
    postMessage({
      type: `${t}-error`,
      error: err.toString()
    })
  }
}