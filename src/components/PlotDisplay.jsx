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
        <div key={s.id}>
          <h3 style={styles.h3}>{s.title}</h3>
          <div id={`plot_${s.id}`}></div>
        </div>
      ))}
    </>
  );
}

const styles = { h3: { margin: "18px 0 8px 0", fontSize: 18, fontWeight: 700 } };