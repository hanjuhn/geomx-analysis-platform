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
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onROIQC} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>ROI QC</button>
          <button onClick={onGeneQC} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>Gene QC</button>
          <button onClick={onPCA} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>PCA</button>
          <button onClick={onDEG} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>DEG</button>
          <button onClick={onSsGSEA} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>ssGSEA Heatmap</button>
          <button onClick={onPathCorr} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>Pathway Corr</button>
          <button onClick={onORABar} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>ORA Bar</button>
          <button onClick={onML} style={styles.btn} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>ML Classification</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05)"
  },
  row: {
    display: "flex",
    gap: 16,
    alignItems: "end",
    flexWrap: "wrap"
  },
  label: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
    fontWeight: 500
  },
  select: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(203, 213, 225, 0.6)",
    background: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
    minWidth: 150
  },
  btn: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap"
  },
  metrics: {
    display: "flex",
    gap: 20,
    alignItems: "center",
    color: "#334155",
    fontWeight: 600,
    fontSize: 14,
    padding: "8px 16px",
    background: "rgba(241, 245, 249, 0.8)",
    borderRadius: 10,
    border: "1px solid rgba(203, 213, 225, 0.3)"
  },
};