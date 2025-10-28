import React from "react";

export default function FileUploader({ files, setFiles, onUpload }) {
  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <div>
          <div style={styles.label}>count.txt</div>
          <input type="file" accept=".txt" onChange={e => setFiles(f => ({ ...f, count: e.target.files[0] }))}/>
        </div>
        <div>
          <div style={styles.label}>metadata.txt</div>
          <input type="file" accept=".txt" onChange={e => setFiles(f => ({ ...f, meta: e.target.files[0] }))}/>
        </div>
        <div>
          <div style={styles.label}>genemeta.txt</div>
          <input type="file" accept=".txt" onChange={e => setFiles(f => ({ ...f, gene: e.target.files[0] }))}/>
        </div>
        <button onClick={onUpload} style={styles.btn}>데이터 로드</button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 12 },
  row: { display: "flex", gap: 14, alignItems: "end", flexWrap: "wrap" },
  label: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  btn: { background: "#0ea5e9", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
};