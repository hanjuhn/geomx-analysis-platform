import React from "react";

export default function QCControls({
  roiThreshold, setRoiThreshold,
  minCount, setMinCount,
  sampleFraction, setSampleFraction,
  detectFraction, setDetectFraction
}) {
  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <QCInput label="ROI Threshold" value={roiThreshold} onChange={setRoiThreshold} />
        <QCInput label="Gene min count" value={minCount} onChange={setMinCount} />
        <QCInput label="Gene sample fraction" value={sampleFraction} onChange={setSampleFraction} step="0.05" min="0" max="1" />
        <QCInput label="Detection fraction" value={detectFraction} onChange={setDetectFraction} step="0.05" min="0" max="1" />
      </div>
    </div>
  );
}

function QCInput({ label, value, onChange, ...rest }) {
  return (
    <div>
      <div style={styles.label}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={styles.input}
        {...rest}
      />
    </div>
  );
}

const styles = {
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 12 },
  row: { display: "flex", gap: 14, alignItems: "end", flexWrap: "wrap" },
  label: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  input: { padding: "6px 8px", borderRadius: 8, border: "1px solid #cbd5e1", width: 100 },
};