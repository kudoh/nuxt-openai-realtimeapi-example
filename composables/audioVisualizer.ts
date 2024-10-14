export function useAudioVisualizer() {
  function initCanvas(canvasRef: Ref<HTMLCanvasElement>, audioContext: AudioContext, analyser: AnalyserNode, isActive: Ref<boolean>) {
    analyser.fftSize = 2048;
    const dataArray: Uint8Array = new Uint8Array(analyser.fftSize);

    const drawWaveform = (source: { type: 'stream'; stream: MediaStream } | { type: 'node'; node: AudioNode }) => {
      const canvas = canvasRef.value;

      if (!canvas) {
        console.log('canvas not found');
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (source.type === 'stream') {
        const node = audioContext.createMediaStreamSource(source.stream);
        node.connect(analyser);
      } else {
        source.node.connect(analyser);
      }

      const draw = () => {
        if (!analyser || !dataArray) return;
        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.beginPath();

        const sliceWidth = (canvas.width * 1.0) / analyser.fftSize;
        let x = 0;

        for (let i = 0; i < analyser.fftSize; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        if (isActive.value) {
          requestAnimationFrame(draw);
        }
      };
      draw();
    };
    return { drawWaveform };
  }

  return {
    initCanvas,
  };
}
