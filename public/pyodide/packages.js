// packages.js
let pyodide = null;

async function initPyodidePackages() {
  importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js");

  pyodide = await loadPyodide();
  
  // 전역으로 노출
  self.pyodide = pyodide;

  await pyodide.loadPackage([
    "micropip",
    "numpy",
    "pandas",
    "matplotlib",
    "scipy",
    "pyodide-http",
    "requests"
  ]);

  postMessage({ type: "pyodide-ready" });
}

initPyodidePackages();