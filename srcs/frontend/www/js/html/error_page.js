function displayPageError(status, message) {
	return `
		<div class="login-box" id="body_error">
			<div class="success-message">
				<div id="h1_error"><h3>Something went wrong!</h3></div>
				<div id="h2_error">Error ${status} occured ("${message}").</div>
				<div id="h3_error"><button class="btn btn-outline-warning button-size" id="a_error" href="">Restart</button></div>
			</div>
		</div>
	`;
}

export { displayPageError }