function displaySlidingMessage(message, invite = false) {
	const minLength = 10;
	if (message.length < minLength) {
		message = message.padEnd(minLength, ' ');
	}
	const slidingMessageDiv = document.getElementById('slidingMessage');
	slidingMessageDiv.textContent = message;
	slidingMessageDiv.style.animation = 'none';
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			slidingMessageDiv.style.animation = 'slide-in 20s linear infinite';
		});
	});
}

function limparDivAll(divId) {
	var div = document.getElementById(divId);
	if (div) {
		var children = div.childNodes;
		for (var i = children.length - 1; i >= 0; i--) {
			var child = children[i];
			div.removeChild(child);
		}
	} else {
		console.error("O elemento com o ID fornecido não foi encontrado.");
	}
}

function displayError(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.textContent = `${errorMessage} Try again`;
	errorDiv.style.display = 'block';
	document.getElementById('form1Example1').focus();
	const registerForm = document.querySelector('#userRegisterForm');
	for (let element of registerForm.elements) {
		if (element.classList.contains('form-control')) {
			element.addEventListener('input', function () {
				if (element.value) {
					errorDiv.style.display = 'none';
				}
			});
		}
	}
}

function displayErrorSignIn(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.innerHTML = "";
	errorDiv.textContent = `${errorMessage} Try again`;
	errorDiv.style.display = 'block';
	document.getElementById('form1Example1').focus();
	const registerForm = document.querySelector('#userSignInForm');
	for (let element of registerForm.elements) {
		if (element.classList.contains('form-control')) {
			element.addEventListener('input', function () {
				if (element.value) {
					errorDiv.style.display = 'none';
				}
			});
		}
	}
}

function logoutContainer(username) {
	document.getElementById('root').innerHTML = `
	<div class="login-box" id="body_error">
		<div class="success-message">
			<div id="h1_error">
				<div class="success-message" id="successMessage" >User ${username} just logged out with success.</div>
			</div>
		</div>
	</div>
	`;
}

function successContainer(success_message) {
	return `
	<div class="login-box" id="body_error">
		<div class="success-message">
			<div id="h1_error">
				<div class="success-message" id="successMessage" >User ${success_message} logged in with success.</div>
			</div>
		</div>
	</div>
	`;
}

function successContainerRegister(success_message) {
	return `
	<div class="login-box" id="body_error">
		<div class="success-message">
			<div id="h1_error">
				<div class="success-message" id="successMessage" >User ${success_message} registered with success.</div>
			</div>
		</div>
	</div>
	`;
}

function messageContainerToken() {
	return `
	<div class="login-box" id="body_error">
		<div class="success-message">
			<div id="h1_error">
				<div class="success-message" id="tokenMessage" >Your session has expired. Login again!!</div>
			</div>
		</div>
	</div>
	`;
}

function deactivateLinks(links) {
	if (!viewToken()) {
		for (let link of links) {
			if (link.dataset.value) {
				link.style.pointerEvents = 'none';
				link.style.cursor = 'default';
			}
		}
	}
}

function handleInput(inputField, limitChar, marginOnEmpty = '10px', marginOnInput = '0') {
	inputField.addEventListener('input', function () {
		if (inputField.value.length > 0) {
			limitChar.style.display = 'block';
			inputField.style.marginBottom = marginOnInput;
		} else {
			limitChar.style.display = 'none';
			inputField.style.marginBottom = marginOnEmpty;
		}
	});
}


function handleInputBlur(inputField, limitChar, marginOnEmpty = '10px') {
	inputField.addEventListener('blur', () => {
		limitChar.style.display = 'none';
		inputField.style.marginBottom = marginOnEmpty;
	});
}

function clearCookies() {
	const cookies = document.cookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i];
		const eqPos = cookie.indexOf("=");
		const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
		document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
	}
}

export { displaySlidingMessage, limparDivAll, displayError, displayErrorSignIn, successContainer, logoutContainer, successContainerRegister, messageContainerToken, handleInput, handleInputBlur }