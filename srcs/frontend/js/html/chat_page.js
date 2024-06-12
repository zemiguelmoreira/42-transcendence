function createChatPage() {
	return `<h1>WebSocket Chat</h1>
    <div id="chat-log"></div>
    <input id="chat-message-input" type="text" size="100">
    <input id="chat-message-submit" type="button" value="Send">
    `
}

const chat_page = makeChatPage();

export { chat_page }