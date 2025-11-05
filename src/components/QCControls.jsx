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
    <div style={styles.inputWrapper}>
      <div style={styles.label}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={styles.input}
        onFocus={(e) => {
          e.target.style.borderColor = "#667eea";
          e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(203, 213, 225, 0.6)";
          e.target.style.boxShadow = "none";
        }}
        {...rest}
      />
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
    marginBottom: 32,
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
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  input: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(203, 213, 225, 0.6)",
    width: 120,
    background: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    transition: "all 0.2s ease",
    outline: "none"
  },
};