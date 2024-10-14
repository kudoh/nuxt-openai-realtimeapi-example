type Params = {
  url: string;
  logMessage: (string) => void;
  onMessageCallback?: (message: MessageEvent) => void;
};

export const useRealtimeApi = ({ url, logMessage, onMessageCallback }: Params) => {
  let ws: WebSocket | null = null;
  const isConnected = ref(false);

  /**
   * Establishes a connection to the specified URL using WebSocket.
   * If the connection is successful, logs a message indicating the connection.
   * If a connection closure is detected, logs a disconnection message.
   * If an error occurs during the connection, logs an error message.
   * If a message is received, executes the specified callback function.
   *
   * @return {void}
   */
  function connect() {
    if (isConnected.value) return;

    ws = new WebSocket(url);
    ws.onopen = () => {
      logMessage('Connected to server🍻');
      isConnected.value = true;
    };

    ws.onclose = () => {
      logMessage('Disconnected👋');
      isConnected.value = false;
    };

    ws.onerror = (error) => {
      logMessage('Error occurred😭: ' + error.message);
    };

    ws.onmessage = (message: MessageEvent) => {
      if (onMessageCallback) onMessageCallback(message);
    };
  }

  /**
   * Disconnects the websocket connection if it exists.
   *
   * @return {void}
   */
  function disconnect() {
    if (ws) ws.close();
  }

  /**
   * Sends a message to the WebSocket server if the connection is established.
   *
   * @param {unknown} data - The data to be sent as a message. It will be stringified as JSON before sending.
   *
   * @return {void} This method does not return anything.
   */
  function sendMessage(data: unknown) {
    if (ws && isConnected.value) {
      ws.send(JSON.stringify(data));
    }
  }

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
  };
};
