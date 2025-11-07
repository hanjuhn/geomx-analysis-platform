// pathwayUtils.js

export async function exportExprCsv(webR, onlyGenes = null) {
  // logCPM -> CSV: optional gene filter (character vector)
  const rGeneVec = (arr) => {
    if (!arr || arr.length === 0) return "NULL";
    const parts = arr.map(g => `"${g.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    return `c(${parts.join(",")})`;
  };
  const geneVec = rGeneVec(onlyGenes);
  const code = `{
    smp <- samples$SegmentDisplayName
    mat <- logCPM
    colnames(mat) <- smp
    if (!is.null(${geneVec})) {
      rn <- rownames(mat)
      gv <- unique(trimws(${geneVec}))
      keep <- rn[tolower(rn) %in% tolower(gv)]
      mat <- mat[keep, , drop=FALSE]
    }
    if (nrow(mat) == 0) "" else {
      header <- paste(c("gene", colnames(mat)), collapse=",")
      body <- apply(mat, 1, function(r) paste(format(r, trim=TRUE, scientific=FALSE), collapse=","))
      rows <- paste(rownames(mat), body, sep=",")
      paste(header, paste(rows, collapse="\n"), sep="\n")
    }
  }`;
  try {
    const csv = await webR.evalR(code);
    return await csv.toString();
  } catch (e) { 
    return ""; 
  }
}

export async function ensurePyodideReady(pyodide) {
  const start = Date.now();
  while (!pyodide?.ready && Date.now() - start < 4000) {
    await new Promise(r => setTimeout(r, 100));
  }
  return !!pyodide?.ready;
}

export async function getDegGenesSafe(webR, degGenes) {
  if (degGenes && degGenes.length > 0) return degGenes;
  try {
    const res = await webR.evalR(`if (exists("top30_genes")) paste(top30_genes, collapse="\n") else ""`);
    const txt = await res.toString();
    const arr = txt.trim().length > 0 ? txt.trim().split("\n") : [];
    return arr;
  } catch (_) {
    return [];
  }
}



