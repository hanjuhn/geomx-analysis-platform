import React from "react";

export default function FileUploader({ files, setFiles, onUpload }) {
  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <div style={styles.fileInputWrapper}>
          <div style={styles.label}>count.txt</div>
          <input
            type="file"
            accept=".txt"
            onChange={e => setFiles(f => ({ ...f, count: e.target.files[0] }))}
            style={styles.fileInput}
            id="file-count"
          />
          <div style={styles.fileName}>
            {files.count ? (
              <span style={styles.fileNameText}>{files.count.name}</span>
            ) : (
              <span style={styles.noFileText}>선택한 파일 없음</span>
            )}
          </div>
        </div>
        <div style={styles.fileInputWrapper}>
          <div style={styles.label}>metadata.txt</div>
          <input
            type="file"
            accept=".txt"
            onChange={e => setFiles(f => ({ ...f, meta: e.target.files[0] }))}
            style={styles.fileInput}
            id="file-meta"
          />
          <div style={styles.fileName}>
            {files.meta ? (
              <span style={styles.fileNameText}>{files.meta.name}</span>
            ) : (
              <span style={styles.noFileText}>선택한 파일 없음</span>
            )}
          </div>
        </div>
        <div style={styles.fileInputWrapper}>
          <div style={styles.label}>genemeta.txt</div>
          <input
            type="file"
            accept=".txt"
            onChange={e => setFiles(f => ({ ...f, gene: e.target.files[0] }))}
            style={styles.fileInput}
            id="file-gene"
          />
          <div style={styles.fileName}>
            {files.gene ? (
              <span style={styles.fileNameText}>{files.gene.name}</span>
            ) : (
              <span style={styles.noFileText}>선택한 파일 없음</span>
            )}
          </div>
        </div>
        <button
          onClick={onUpload}
          style={styles.btn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 12px -2px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(102, 126, 234, 0.3)";
          }}
        >
          데이터 로드
        </button>
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
    gap: 32,
    alignItems: "flex-start",
    flexWrap: "nowrap"
  },
  fileInputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: "0 0 auto",
    minWidth: 200,
    maxWidth: 250
  },
  label: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
    fontWeight: 500,
    whiteSpace: "nowrap"
  },
  fileInput: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(203, 213, 225, 0.6)",
    background: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
    width: "100%"
  },
  fileName: {
    marginTop: 4,
    minHeight: 20,
    display: "flex",
    alignItems: "center"
  },
  fileNameText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
    maxWidth: "100%"
  },
  noFileText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    display: "block"
  },
  btn: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
    transition: "all 0.2s ease",
    alignSelf: "flex-start",
    marginTop: 25.5,
    height: "fit-content"
  },
};