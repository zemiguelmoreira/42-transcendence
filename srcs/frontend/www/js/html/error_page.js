function displayPageError(status, message) {
	return `
	<div id="body_error">
		<div class="font-custom container_error login-middle-box login-box">
			<div class="font-custom" id="h1_error">:(</div>
			<div class="font-custom" id="h2_error">A ${status} 42 Transcendence error occured, ${message}.</div>
			<div id="h3_error"><a class="font-custom" id="a_error" href="">Return to home</a></div>
		</div>
	</div>
	`;
}

export { displayPageError }