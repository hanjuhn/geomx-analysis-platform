export async function initWebR(setStatus) {
  try {
    // CDN에서 동적으로 로드하여 Vite 번들링 문제 회피
    const { WebR } = await import(
      /* @vite-ignore */
      "https://webr.r-wasm.org/v0.5.7/webr.mjs"
    );
    const webR = new WebR({ interactive: false });
    await webR.init();
    setStatus("WebR 초기화 완료");
    return webR;
  } catch (err) {
    setStatus("WebR 초기화 실패 " + err.message);
    throw err;
  }
}

export async function evalR(webR, code) {
  return await webR.evalR(code);
}

export async function evalRVoid(webR, code) {
  return await webR.evalRVoid(code);
}

export async function evalRToString(webR, code) {
  const res = await evalR(webR, code);
  return await res.toString();
}