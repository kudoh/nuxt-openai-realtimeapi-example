class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const channelData = input[0];
    if (!channelData) return false;
    const pcm16Data = convertFloat32ToPCM16(channelData);

    this.port.postMessage(pcm16Data.buffer);
    return true;
  }
}

function convertFloat32ToPCM16(float32Array) {
  const pcm16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm16Array;
}

registerProcessor('audio-processor', AudioProcessor);
