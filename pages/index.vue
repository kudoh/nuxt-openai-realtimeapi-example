<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Nuxt + OpenAI Realtime API</h1>
      <ul class="space-y-4">
        <li>
          <NuxtLink
            to="/webrtc"
            class="block py-3 px-4 bg-blue-500 text-white font-semibold rounded-lg
                   text-center transition hover:bg-blue-600"
          >
            WebRTC version
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/websocket"
            class="block py-3 px-4 bg-green-500 text-white font-semibold rounded-lg
                   text-center transition hover:bg-green-600"
          >
            WebSocket version
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
