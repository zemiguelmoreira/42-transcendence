function startLocalPongPage() {
	return `
	<div class="local-pending" id="localPending">
		<div class="local-box">
			<div class="logo-box1">PONG</div>
			<div class="font-custom">Guest Name</div>
			<input id="guestInput" class="local-input" type="text" placeholder="Enter guest name" maxlength="10" autofocus>
			<button id="playButton" class="btn btn-success local-btn">Play</button>
			<button id="cancelButton" class="btn btn-danger local-btn">Cancel</button>
		</div>
	</div>
	`;
}

const local_page = startLocalPongPage();

export { local_page }