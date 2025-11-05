// dataStore.js

// CSV / JSON 저장 변수
self._data = null        // volcano CSV
self._heatmap = null     // heatmap matrix CSV
self._expr = null        // ssGSEA expression CSV
self._gmt = null         // GMT text
self._groupInfo = null   // group info JSON

function handleDataMessage(event) {
  const { type, payload } = event.data

  /* ✅ Volcano용 CSV 저장 */
  if (type === "setData") {
    self._data = payload
    postMessage({ type: "setData-complete" })
  }

  /* ✅ Heatmap CSV 저장 */
  if (type === "setHeatmap") {
    self._heatmap = payload
    postMessage({ type: "setHeatmap-complete" })
  }

  /* ✅ ssGSEA 표현 행렬 저장 */
  if (type === "setExpr") {
    self._expr = payload
    postMessage({ type: "setExpr-complete" })
  }

  /* ✅ GMT text 저장 */
  if (type === "setGeneSets") {
    self._gmt = payload
    postMessage({ type: "setGeneSets-complete" })
  }

  /* ✅ 그룹 정보 JSON 저장 */
  if (type === "setGroupInfo") {
    self._groupInfo = payload
    postMessage({ type: "setGroupInfo-complete" })
  }
}