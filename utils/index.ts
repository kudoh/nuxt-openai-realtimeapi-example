export function arrayBufferToAudioData(buffer: ArrayBuffer) {
  return Float32Array.from(new Int16Array(buffer), value => value / 0x8000);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  return window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
