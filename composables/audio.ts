const BUFFER_SIZE = 8192;
const BUFFER_INTERVAL = 1000;

type Params = {
  audioCanvas: Ref<HTMLCanvasElement>;
  logMessage: (string) => void;
  onFlushCallback: (buffer: ArrayBuffer) => void;
};

/**
 * Initiates the audio recording process by setting the recording state to true, creating an AudioContext object,
 * initializing an audio analyser, and adding an audio worklet module for processing audio data.
 * It then requests access to the user's audio device, establishes a media stream source, and connects it to an
 * AudioWorkletNode for further processing. Additionally, it sets up a periodic flush function to process audio buffers
 * and a callback to handle incoming audio data messages.
 * If available, it also renders a waveform visualization of the audio stream.
 * Finally, it logs a message indicating that recording has started.
 *
 * @param {Object} Params - The parameters object.
 * @param {HTMLElement} Params.audioCanvas - The HTML canvas element to render audio visualizations.
 * @param {Function} Params.logMessage - The callback function for logging messages.
 * @param {Function} Params.onFlushCallback - The callback function for handling flushed audio data.
 *
 * @return {Object} - An object containing functions to control audio recording.
 */
export function useAudio({ audioCanvas, logMessage, onFlushCallback }: Params) {
  let audioContext: AudioContext | null = null;
  const isRecording = ref(false);
  const isPlaying = ref(false);
  const { initCanvas } = useAudioVisualizer();

  let audioBuffer: Int16Array[] = [];
  let currentBufferSize = 0;
  let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  const audioQueue: Float32Array[] = [];
  let flushBufferTimeoutId: number | null = null;
  const audioWaveform = ref<ReturnType<typeof initCanvas>>();

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
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    const analyser = audioContext.createAnalyser();
    audioWaveform.value = initCanvas(audioCanvas, audioContext, analyser, isRecording);

    await audioContext.audioWorklet.addModule('/audio-processor.js');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');

    audioWorkletNode.port.onmessage = event => processAudioData(event.data);

    flushBufferTimeoutId = setInterval(() => {
      if (audioBuffer.length > 0) {
        flushBuffer();
      }
    }, BUFFER_INTERVAL);

    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    mediaStreamSource.connect(audioWorkletNode);

    if (audioWaveform.value) {
      audioWaveform.value.drawWaveform({ type: 'stream', stream: stream });
    }
    logMessage('Start Recording...🎙️');
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

    isPlaying.value = true;
    const audio = audioQueue.shift();
    if (!audio) return;

    const audioBuffer = audioContext.createBuffer(1, audio.length, audioContext.sampleRate);
    audioBuffer.copyToChannel(audio, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    source.onended = () => {
      isPlaying.value = false;
      playFromQueue(); // play next queue
    };
  }

  /**
   * Enqueues the provided audio buffer to the audio queue.
   *
   * @param {Float32Array} buffer - The audio buffer to be enqueued.
   *
   * @return {void}
   */
  function enqueueAudio(buffer: Float32Array) {
    audioQueue.push(buffer);
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
