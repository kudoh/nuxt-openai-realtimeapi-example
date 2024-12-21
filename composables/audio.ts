const BUFFER_SIZE = 8192;
const BUFFER_INTERVAL = 1000;

type Params = {
  audioCanvas: Ref<HTMLCanvasElement | null>;
  logMessage: (msg: string) => void;
  onFlushCallback: (buffer: ArrayBuffer) => void;
};

export function useAudio({ audioCanvas, logMessage, onFlushCallback }: Params) {
  let audioContext: AudioContext | null = null;
  const isRecording = ref(false);
  const isPlaying = ref(false);
  const { initCanvas } = useAudioVisualizer();
  let audioWaveform: ReturnType<typeof initCanvas> | null = null;

  let analyser: AnalyserNode | null;
  let audioBuffer: Int16Array[] = [];
  let currentBufferSize = 0;
  let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  const audioQueue: Float32Array[] = [];
  let flushBufferTimeoutId: number | null = null;

  /**
   * Initiates the audio recording process by setting the recording state to true, creating an AudioContext object,
   * initializing an audio analyser, and adding an audio worklet module for processing audio data.
   * It then requests access to the user's audio device, establishes a media stream source, and connects it to an
   * AudioWorkletNode for further processing. Additionally, it sets up a periodic flush function to process audio buffers
   * and a callback to handle incoming audio data messages.
   * If available, it also renders a waveform visualization of the audio stream.
   * Finally, it logs a message indicating that recording has started.
   *
   * @return {void}
   */
  async function startRecording() {
    isRecording.value = true;
    try {
      // マイクの準備(許可要求)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContext = new window.AudioContext({ sampleRate: 24000 });

      // 音声変換プロセッサ(32-bit float -> PCM16): オーディオスレッド(AudioWorklet)
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      audioWorkletNode.port.onmessage = event => processAudioData(event.data);

      // マイクの入力を音声変換プロセッサに接続
      mediaStreamSource = new MediaStreamAudioSourceNode(audioContext, { mediaStream });
      mediaStreamSource.connect(audioWorkletNode);

      // 音声分析ノードも接続(波形表示)
      analyser = new AnalyserNode(audioContext, {
        fftSize: 2048,
      });
      mediaStreamSource.connect(analyser);
      audioWaveform = initCanvas(audioCanvas, analyser);
      audioWaveform.drawWaveform();

      // 一定間隔でFlush
      flushBufferTimeoutId = window.setInterval(() => {
        if (audioBuffer.length > 0) {
          flushBuffer();
        }
      }, BUFFER_INTERVAL);

      logMessage('Start Recording...🎙️');
    } catch (e) {
      if (e instanceof DOMException) {
        if (e.name === 'NotAllowedError') {
          logMessage('Allow audio use');
          isRecording.value = false;
          return;
        } else if (e.name === 'NotFoundError') {
          logMessage('Device not found');
          isRecording.value = false;
          return;
        }
      }
      throw e;
    }
  }

  function processAudioData(data: ArrayBuffer) {
    const pcm16Data = new Int16Array(data);
    audioBuffer.push(pcm16Data);
    currentBufferSize += pcm16Data.length * 2;

    if (currentBufferSize >= BUFFER_SIZE) {
      flushBuffer();
    }
  }

  function flushBuffer() {
    const totalLength = audioBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedBuffer = new Int16Array(totalLength);

    let offset = 0;
    audioBuffer.forEach((chunk) => {
      mergedBuffer.set(chunk, offset);
      offset += chunk.length;
    });

    onFlushCallback(mergedBuffer.buffer);

    audioBuffer = [];
    currentBufferSize = 0;
  }

  /**
   * Stops the currently ongoing recording process if it is currently active.
   * This method disconnects the media stream source and sets the isRecording flag to false.
   * If there is a pending flush buffer timeout, it will be cleared.
   * Additionally, this method logs a message indicating that the recording has stopped.
   *
   * @return {void}
   */
  function stopRecording() {
    if (!isRecording.value) return;

    mediaStreamSource?.disconnect();
    mediaStreamSource = null;
    analyser?.disconnect();
    analyser = null;
    audioContext?.close();
    audioContext = null;
    audioWaveform?.stop();
    audioWaveform = null;
    isRecording.value = false;

    if (flushBufferTimeoutId !== null) {
      clearTimeout(flushBufferTimeoutId);
      flushBufferTimeoutId = null;
    }
    logMessage('Stop recording⏹️');
  }

  /**
   * Plays audio files from a queue in sequence. If there is no ongoing playback,
   * and the audio queue is not empty, it extracts the first audio file from the queue,
   * creates a buffer for it, connects it to the audio context destination, and starts playback.
   * Upon completion of playback, it sets the isPlaying flag to false and proceeds to play the next
   * file in the queue if available.
   *
   * @return {void}
   */
  function playFromQueue() {
    if (isPlaying.value || audioQueue.length === 0 || !audioContext) {
      return;
    }

    // キューから音声を取り出し
    const audio = audioQueue.shift();
    if (!audio) return;
    isPlaying.value = true;

    // 音声出力をデバイス(スピーカー)/音声分析ノードに接続
    const audioBuffer = new AudioBuffer({
      numberOfChannels: 1,
      length: audio.length,
      sampleRate: audioContext.sampleRate,
    });
    audioBuffer.copyToChannel(audio, 0);
    const source = new AudioBufferSourceNode(
      audioContext, {
        buffer: audioBuffer,
      },
    );
    source.connect(audioContext.destination);
    source.connect(analyser!); // 出力の音声波形表示用
    source.start();

    source.onended = () => {
      isPlaying.value = false;
      playFromQueue(); // play next queue
    };
  }

  /**
   * Enqueues the provided audio buffer to the audio queue.
   *
   * @param {ArrayBuffer} buffer - The audio buffer to be enqueued.
   *
   * @return {void}
   */
  function enqueueAudio(buffer: ArrayBuffer) {
    audioQueue.push(arrayBufferToAudioData(buffer));
    if (!isPlaying.value) {
      playFromQueue();
    }
  }
  return {
    startRecording,
    stopRecording,
    enqueueAudio,
    isPlaying,
    isRecording,
  };
}
