import React, { useEffect, useRef, useState } from "react";
import FileUploader from "./components/FileUploader";
import QCControls from "./components/QCControls";
import AnalysisButtons from "./components/AnalysisButtons";
import PlotDisplay from "./components/PlotDisplay";

import { initWebR } from "./core/webRInit";
import { handleUploadAll } from "./core/fileHandlers";

import { handleROIQC } from "./analysis/handleROIQC";
import { handleGeneQC } from "./analysis/handleGeneQC";
import { handlePCA } from "./analysis/handlePCA";
import { handleDEG } from "./analysis/handleDEG";
import { handleML } from "./analysis/handleML";

export default function GeoMxWebRApp() {
  const [status, setStatus] = useState("webR 초기화 중");
  const [files, setFiles] = useState({ count: null, meta: null, gene: null });

  const [columns, setColumns] = useState(["NT_or_TC", "CD31", "Cirrhosis", "PatientID"]);
  const [groupCol, setGroupCol] = useState("NT_or_TC");

  const [roiThreshold, setRoiThreshold] = useState(10);
  const [minCount, setMinCount] = useState(5);
  const [sampleFraction, setSampleFraction] = useState(0.9);
  const [detectFraction, setDetectFraction] = useState(0.8);

  const [roiKept, setRoiKept] = useState(null);
  const [roiTotal, setRoiTotal] = useState(null);
  const [geneKept, setGeneKept] = useState(null);
  const [geneTotal, setGeneTotal] = useState(null);

  const [degGenes, setDegGenes] = useState([]);   // ✅ UI에 출력 목표

  const webRRef = useRef(null);
  const qcAppliedRef = useRef({ roi: false, gene: false });
  const logCPMReadyRef = useRef(false);

  useEffect(() => {
    (async () => {
      webRRef.current = await initWebR(setStatus);
    })();
  }, []);

  const onUpload = async () => {
    await handleUploadAll({
      webR: webRRef.current,
      files,
      setStatus,
      setRoiTotal,
      setRoiKept,
      setGeneTotal,
      setGeneKept,
      setColumns,
      setGroupCol,
      qcAppliedRef,
      logCPMReadyRef
    });
  };

  const onROIQC = async () => {
    await handleROIQC({
      webR: webRRef.current,
      setStatus,
      roiThreshold,
      setRoiKept,
      setRoiTotal,
      qcAppliedRef
    });
  };

  const onGeneQC = async () => {
    await handleGeneQC({
      webR: webRRef.current,
      setStatus,
      minCount,
      sampleFraction,
      detectFraction,
      setGeneKept,
      setGeneTotal,
      qcAppliedRef
    });
  };

  const onPCA = async () => {
    await handlePCA({
      webR: webRRef.current,
      setStatus,
      groupCol,
      qcAppliedRef,
      logCPMReadyRef
    });
  };

  const onDEG = async () => {
    await handleDEG({
      webR: webRRef.current,
      setStatus,
      groupCol,
      qcAppliedRef,
      logCPMReadyRef,
      setDegGenes        
    });
  };

  const onML = async () => {
    await handleML({
      webR: webRRef.current,
      setStatus,
      groupCol,
      qcAppliedRef,
      logCPMReadyRef
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>WebR 기반 클라이언트 중심의 GeoMx DSP 데이터 분석 프레임워크 </h1>

      <FileUploader files={files} setFiles={setFiles} onUpload={onUpload} />

      <QCControls
        roiThreshold={roiThreshold} setRoiThreshold={setRoiThreshold}
        minCount={minCount} setMinCount={setMinCount}
        sampleFraction={sampleFraction} setSampleFraction={setSampleFraction}
        detectFraction={detectFraction} setDetectFraction={setDetectFraction}
      />

      <AnalysisButtons
        groupCol={groupCol} setGroupCol={setGroupCol}
        columns={columns}
        roiKept={roiKept} roiTotal={roiTotal}
        geneKept={geneKept} geneTotal={geneTotal}
        onROIQC={onROIQC}
        onGeneQC={onGeneQC}
        onPCA={onPCA}
        onDEG={onDEG}
        onML={onML}
      />

      <div style={styles.status}>{status}</div>

      <PlotDisplay />

      {/*UI: DEG 출력 */}
      <div style={{ marginTop: 30 }}>
        <h3>Top 30 DEG 목록</h3>
        {degGenes.length === 0 ? (
          <div>유의한 DEG 없음</div>
        ) : (
          <ul style={{ maxHeight: 200, overflowY: "auto" }}>
            {degGenes.map((g, idx) => (
              <li key={idx}>{g}</li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Inter, system-ui, Arial",
    color: "#0f172a",
    background: "#f8fafc",
    padding: "20px 16px"
  },
  h1: { margin: "4px 0 6px 0", fontSize: 24, fontWeight: 700 },
  desc: { margin: "0 0 16px 0", color: "#475569" },
  status: { margin: "8px 0 16px 0", fontWeight: 700 },
};