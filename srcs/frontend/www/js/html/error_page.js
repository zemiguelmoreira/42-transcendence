




function displayPageError(status, message) {
	return `<div id="body_error">
	<div class="container_error">
		<h1 id="h1_error">:(</h1><br>
		<h2 id="h2_error">A <span>
				<span class="error-text">${status}</span> <span class="replacement-text">42 Transcendence</span>
			</span>
			error occured, ${message}.
		</h2><br><br>
		<h3 id="h3_error"><a id="a_error" href="">Return to home</a></h3>
	</div>
</div>`;
}




export { displayPageError }

