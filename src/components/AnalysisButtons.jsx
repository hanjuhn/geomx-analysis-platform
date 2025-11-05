import React from "react";

export default function AnalysisButtons({
  groupCol, setGroupCol, columns,
  roiKept, roiTotal, geneKept, geneTotal,
  onROIQC, onGeneQC, onPCA, onDEG, onML,
  onSsGSEA, onPathCorr, onORABar
}) {
  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <div>
          <div style={styles.label}>분석 요인</div>
          <select value={groupCol} onChange={e => setGroupCol(e.target.value)} style={styles.select}>
            {columns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={styles.metrics}>
          <div>ROI kept {roiKept ?? "-"} / {roiTotal ?? "-"}</div>
          <div>Gene kept {geneKept ?? "-"} / {geneTotal ?? "-"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onROIQC} style={styles.btn}>ROI QC</button>
          <button onClick={onGeneQC} style={styles.btn}>Gene QC</button>
          <button onClick={onPCA} style={styles.btn}>PCA</button>
          <button onClick={onDEG} style={styles.btn}>DEG</button>
          <button onClick={onSsGSEA} style={styles.btn}>ssGSEA Heatmap</button>
          <button onClick={onPathCorr} style={styles.btn}>Pathway Corr</button>
          <button onClick={onORABar} style={styles.btn}>ORA Bar</button>
          <button onClick={onML} style={styles.btn}>ML Classification</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 12 },
  row: { display: "flex", gap: 14, alignItems: "end", flexWrap: "wrap" },
  label: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  select: { padding: "6px 8px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white" },
  btn: { background: "#0ea5e9", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  metrics: { display: "flex", gap: 16, alignItems: "center", color: "#334155", fontWeight: 600 },
};