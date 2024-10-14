import { WebSocket } from 'ws';
// https://nitro.unjs.io/guide/websocket
// https://crossws.unjs.io/
const connections: { [id: string]: WebSocket } = {};

export default defineWebSocketHandler({
  open(peer) {
    if (!connections[peer.id]) {
      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
      connections[peer.id] = new WebSocket(url, {
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
          'OpenAI-Beta': 'realtime=v1',
        },
      });
    }
    const instructions = '明るく元気に話してください。仲の良い友人のように振る舞い、敬語は使わないでください。出力は日本語でしてください。';

    connections[peer.id].on('open', () => {
      connections[peer.id].send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: 'shimmer',
          instructions: instructions,
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: { type: 'server_vad' },
        },
      }));
    });
    connections[peer.id].on('message', (message) => {
      peer.send(message.toString()); // send back the server event as it is
    });
  },
  message(peer, message) {
    // relaying the client event as it is
    connections[peer.id].send(message.text());
  },
  close(peer) {
    connections[peer.id].close();
    connections[peer.id] = undefined;
    console.log('closed websocket');
  },
  error(peer, error) {
    console.log('error', { error, id: peer.id });
  },
});
