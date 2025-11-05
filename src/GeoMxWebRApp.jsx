import React, { useEffect, useRef, useState } from "react";
import "./GeoMxWebRApp.css";
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
import { handleSsGSEA, handlePathwayCorr, handleORABar } from "./analysis/handlePathway";
import { exportExprCsv, ensurePyodideReady, getDegGenesSafe } from "./core/pathwayUtils";
import usePyodide from "./core/usePyodide";

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

  const [degGenes, setDegGenes] = useState([]);
  const [gmtText, setGmtText] = useState("");   // WikiPathways GMT 텍스트 저장
  const defaultGmtLibrary = "WikiPathways";

  const webRRef = useRef(null);
  const qcAppliedRef = useRef({ roi: false, gene: false });
  const logCPMReadyRef = useRef(false);

  const pyodide = usePyodide();

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
      setDegGenes,
      pyodide
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

  const onSsGSEA = async () => {
    await handleSsGSEA({
      webR: webRRef.current,
      setStatus,
      groupCol,
      qcAppliedRef,
      logCPMReadyRef,
      pyodide,
      gmtText,
      setGmtText,
      defaultGmtLibrary,
      ensurePyodideReady: () => ensurePyodideReady(pyodide),
      exportExprCsv: (genes) => exportExprCsv(webRRef.current, genes)
    });
  };

  const onPathCorr = async () => {
    await handlePathwayCorr({
      webR: webRRef.current,
      setStatus,
      groupCol,
      qcAppliedRef,
      logCPMReadyRef,
      pyodide,
      gmtText,
      setGmtText,
      defaultGmtLibrary,
      ensurePyodideReady: () => ensurePyodideReady(pyodide),
      exportExprCsv: (genes) => exportExprCsv(webRRef.current, genes),
      getDegGenesSafe: () => getDegGenesSafe(webRRef.current, degGenes)
    });
  };

  const onORABar = async () => {
    await handleORABar({
      webR: webRRef.current,
      setStatus,
      pyodide,
      gmtText,
      setGmtText,
      defaultGmtLibrary,
      ensurePyodideReady: () => ensurePyodideReady(pyodide)
    });
  };

  return (
    <div className="container">
      {/* Header with Logo */}
      <header className="header">
        <div className="headerContent">
          <img src="/image/logo.png" alt="Logo" className="logo" />
          <div className="headerText">
            <h1>클라이언트 기반 GeoMx DSP 데이터 분석 프레임워크</h1>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      <div className="statusBanner">
        <div className="statusIcon">📊</div>
        <div className="status">{status}</div>
      </div>

      {/* Main Content */}
      <div className="mainContent">
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
          onSsGSEA={onSsGSEA}
          onPathCorr={onPathCorr}
          onORABar={onORABar}
          onML={onML}
        />

        <PlotDisplay />

        {/* DEG 출력 */}
        <div className="degSection">
          <h3 className="sectionTitle">Top 30 DEG 목록</h3>
          {degGenes.length === 0 ? (
            <div className="emptyState">유의한 DEG 없음</div>
          ) : (
            <ul className="degList">
              {degGenes.map((g, idx) => (
                <li key={idx} className="degItem">{g}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}