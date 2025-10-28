import { evalR, evalRToString } from "./webRInit";
import { uint8ToBase64 } from "../utils/webRUtils";

export async function capturePlot(webR, rBody, key, setStatus) {
  try {
    const rCode = `
      png("/tmp_plot.png", width=900, height=650)
      ${rBody}
      dev.off()
      con <- file("/tmp_plot.png", "rb")
      raw <- readBin(con, "raw", file.info("/tmp_plot.png")$size)
      close(con)
      paste(as.character(raw), collapse=" ")
    `;
    const txt = await evalRToString(webR, rCode);
    const bytes = txt.trim().split(" ").filter(Boolean).map(x => parseInt(x, 16));
    const base64 = uint8ToBase64(new Uint8Array(bytes));
    const el = document.getElementById(`plot_${key}`);
    if (el) {
      el.innerHTML = `<img src="data:image/png;base64,${base64}" style="max-width:860px;border:1px solid #ddd;border-radius:6px;margin:14px 0"/>`;
    }
    setStatus(key + " 완료");
  } catch (err) {
    setStatus(key + " 오류 " + err.message);
  }
}