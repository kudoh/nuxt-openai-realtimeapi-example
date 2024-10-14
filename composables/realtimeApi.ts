type Params = {
  url: string;
  logMessage: (string) => void;
  onMessageCallback?: (message: MessageEvent) => void;
};

/**
 * Function that sets up and manages a WebSocket connection for real-time communication.
 *
 * @param {Object} Params - The parameters required for configuring the real-time API connection.
 * @param {string} Params.url - The URL of the WebSocket server to connect to.
 * @param {function} Params.logMessage - A function to log messages from the API.
 * @param {function|undefined} Params.onMessageCallback - An optional callback function to handle incoming messages.
 *
 * @returns {Object} An object containing functions and state variables to manage the WebSocket connection:
 * @returns {function} connect - Function to establish the WebSocket connection.
 * @returns {function} disconnect - Function to close the WebSocket connection.
 * @returns {function} sendMessage - Function to send a message over the WebSocket connection.
 * @returns {Ref<boolean>} isConnected - A reactive boolean flag indicating the connection status.
 */
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
