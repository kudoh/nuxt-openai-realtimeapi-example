export function base64ToAudioData(base64Data: string) {
  const pcm16ArrayBuffer = base64ToArrayBuffer(base64Data);
  return Float32Array.from(new Int16Array(pcm16ArrayBuffer), value => value / 0x8000);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
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
