import React from "react";

export default function PlotDisplay() {
  const sections = [
    { id: "QC_ROI", title: "ROI QC" },
    { id: "QC_Gene", title: "Gene QC" },
    { id: "PCA", title: "PCA" },
    { id: "DEG_Volcano", title: "DEG Volcano" },
    { id: "DEG_Heatmap", title: "DEG Heatmap" },
    { id: "SSGSEA_Heatmap", title: "ssGSEA Heatmap" },
    { id: "Pathway_Corr", title: "Pathway Spearman Corr" },
    { id: "ORA_Bar", title: "ORA Enrichment Bar" },
    { id: "ML_RF", title: "ML Confusion Matrix" }
  ];
  return (
    <>
      <div id="plot_info"></div>
      {sections.map(s => (
        <div key={s.id} style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.h3}>{s.title}</h3>
          </div>
          <div id={`plot_${s.id}`} style={styles.plotContainer}></div>
        </div>
      ))}
    </>
  );
}

const styles = {
  section: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: "20px 24px",
    marginBottom: 20,
    boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.3)"
  },
  sectionHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid rgba(102, 126, 234, 0.2)"
  },
  h3: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  plotContainer: {
    minHeight: 100
  }
};