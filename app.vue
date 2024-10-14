<script setup lang="ts">
const audioCanvas = useTemplateRef('audio-canvas');
const messageContainer = useTemplateRef('message-container');
const logContainer = useTemplateRef('log-container');

const log = useLog(messageContainer, logContainer);
const { connect, isConnected, disconnect, sendMessage } = useRealtimeApi({
  url: 'ws://localhost:3000/ws',
  logMessage: log.logMessage,
  onMessageCallback: handleWebSocketMessage,
});

const { startRecording, stopRecording, enqueueAudio, isRecording } = useAudio({
  audioCanvas,
  logMessage: log.logMessage,
  onFlushCallback: handleAudioFlush,
});

const { eventLog, messageLog } = toRefs(log);

// マイクからの音声入力をRealtimeAPIに送信
function handleAudioFlush(buffer: ArrayBuffer) {
  sendMessage({ type: 'input_audio_buffer.append', audio: arrayBufferToBase64(buffer) });
}

// RealtimeAPIからのイベントを制御
function handleWebSocketMessage(message: MessageEvent) {
  const event = JSON.parse(message.data);
  log.logEvent(event.type);
  switch (event.type) {
    case 'response.audio.delta': {
      enqueueAudio(base64ToAudioData(event.delta));
      break;
    }
    case 'response.audio_transcript.done':
      log.logMessage(`🤖: ${event.transcript}`);
      break;
    case 'conversation.item.input_audio_transcription.completed':
      log.logMessage(`😄: ${event.transcript}`);
      break;
    case 'error':
      log.logEvent(event.error);
      if (isRecording.value) stopRecording();
      if (event.code === 'session_expired') disconnect();
      break;
    default:
      break;
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    await stopRecording();
  } else {
    await startRecording();
  }
}

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div class="app p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
    <div class="flex gap-4 mb-6">
      <button
        :disabled="isConnected"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
        @click="connect"
      >
        <i class="fas fa-plug" /> 接続
      </button>
      <button
        :disabled="!isConnected"
        class="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all flex items-center gap-2"
        @click="disconnect"
      >
        <i class="fas fa-times-circle" /> 切断
      </button>
    </div>

    <div
      v-if="isConnected"
      class="mb-6"
    >
      <button
        class="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center gap-2"
        @click="toggleRecording"
      >
        <i :class="isRecording ? 'fas fa-stop' : 'fas fa-play'" /> {{ isRecording ? '録音終了' : '録音開始' }}
      </button>
    </div>

    <canvas
      ref="audio-canvas"
      width="500"
      height="150"
      class="border border-gray-400 rounded shadow-md mb-6"
    />

    <div
      ref="message-container"
      class="w-full max-w-lg h-60 overflow-y-auto bg-white rounded-lg shadow-md p-4"
    >
      <div
        v-for="msg in messageLog"
        :key="msg"
        class="p-2 mb-2 bg-gray-100 rounded border border-gray-200 break-words"
      >
        {{ msg }}
      </div>
    </div>
    <hr>
    <div
      ref="log-container"
      class="w-full mt-2 max-w-lg h-80 overflow-y-auto bg-white rounded-lg shadow-md p-4"
    >
      <div
        v-for="event in eventLog"
        :key="event"
        class="p-1 mb-1 bg-gray-100 break-words"
      >
        {{ event }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  font-family: 'Roboto', sans-serif;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button i {
  font-size: 1.2em;
}
</style>
