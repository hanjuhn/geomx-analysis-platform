import { WebR } from "webr";

export async function initWebR(setStatus) {
  try {
    const webR = new WebR({ interactive: false });
    await webR.init();
    setStatus("webR 초기화 완료");
    return webR;
  } catch (err) {
    setStatus("webR 초기화 실패 " + err.message);
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