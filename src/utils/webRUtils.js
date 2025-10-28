export function uint8ToBase64(uint8Arr) {
  const CHUNK = 0x8000;
  let result = [];
  for (let i = 0; i < uint8Arr.length; i += CHUNK) {
    let sub = uint8Arr.subarray(i, i + CHUNK);
    result.push(String.fromCharCode.apply(null, sub));
  }
  return btoa(result.join(""));
}