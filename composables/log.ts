export function useLog(messageContainer: Ref<HTMLElement>, logContainer: Ref<HTMLElement>) {
  const messageLog = ref<string[]>([]);
  const eventLog = ref<string[]>([]);

  function logMessage(message: string) {
    messageLog.value.push(message);
    if (messageContainer.value) scroll(messageContainer);
  }

  function logEvent(message: string) {
    eventLog.value.push(message);
    if (logContainer.value) scroll(logContainer);
  }

  function scroll(containerRef: Ref<HTMLElement>) {
    nextTick(() => {
      const container = containerRef.value;
      container.scrollTop = container.scrollHeight;
    });
  }

  return {
    messageLog,
    eventLog,
    logMessage,
    logEvent,
  };
}
