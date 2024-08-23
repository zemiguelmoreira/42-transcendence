
function makeChatWindow() {
	return `
	<div class="chatContainer">
		<div class="sliding-window closed">
			<div class="slidingChatContainer">
				<div class="chat-container">
					<div class="users-list">
						<ul id="online-users-list"></ul>
					</div>
					<div class="chat-window">
						<div class="messages" id="chat-log"></div>
						<div class="message-input">
							<input id="chat-message-input" type="text" placeholder="Type a message...">
							<button id="chat-message-submit">Send</button>
							<!-- <button id="inviteButton">Invite to play</button> -->
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	`;
}

const chatWindowHtml = makeChatWindow();

export { chatWindowHtml }
