export function startAChat() {
  return {
    subscription: 'ws://backend_url/chat_socket?subscription=[jwt]',
    task_uuid: '1232131',
  }
}
