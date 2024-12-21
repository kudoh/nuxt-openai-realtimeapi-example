export function useAudioVisualizer() {
  function initCanvas(canvasRef: Ref<HTMLCanvasElement | null>, analyser: AnalyserNode) {
    const dataArray: Uint8Array = new Uint8Array(analyser.fftSize);
    let animationFrameId: number | null = null; // requestAnimationFrameのID管理
    let running = true; // 描画の実行フラグ

    const drawWaveform = () => {
      const canvas = canvasRef.value;

      if (!canvas) {
        console.log('canvas not found');
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        if (!running) return; // 停止フラグが立っていたら描画を中断

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

        animationFrameId = requestAnimationFrame(draw); // next frame
      };
      draw();
    };

    const stop = () => {
      running = false; // 描画の実行を停止
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      const canvas = canvasRef.value;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    return { drawWaveform, stop };
  }

  return {
    initCanvas,
  };
}
