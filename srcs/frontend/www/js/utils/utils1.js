function displaySlidingMessage(message, rep = '4') {
	const minLength = 10;
	if (message.length < minLength) {
		message = message.padEnd(minLength, ' ');
	}
	const slidingMessageDiv = document.getElementById('slidingMessage');
	if (!slidingMessageDiv) {
		console.log("Element with ID 'slidingMessage' not found.");
		return;
	}
	// Show the element again (in case it was hidden)
	slidingMessageDiv.style.display = 'block';
	slidingMessageDiv.textContent = message;
	// Reset the animation by setting it to 'none' first
	slidingMessageDiv.style.animation = 'none';
	// Remove any previous 'animationend' listeners to prevent duplicate calls
	slidingMessageDiv.removeEventListener('animationend', handleAnimationEnd);
	// Use requestAnimationFrame to restart the animation
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			slidingMessageDiv.style.animation = `slide-in 20s linear ${rep}`;
		});
	});
	// Function to handle the animation ending when reps are finite
	function handleAnimationEnd() {
		if (rep !== 'infinite') {
			// Hide the element when the animation completes
			slidingMessageDiv.style.display = 'none';
		}
	}
	// Add an event listener for the animationend event only when rep is finite
	if (rep !== 'infinite') {
		slidingMessageDiv.addEventListener('animationend', handleAnimationEnd);
	}
}


function clearSlidingMessage() {
	const slidingMessageDiv = document.getElementById('slidingMessage');
	if (!slidingMessageDiv) {
		console.log("Element with ID 'slidingMessage' not found.");
		return;
	}
	const handleAnimationIteration = () => {
		// Hide the element when the current cycle ends (next iteration begins)
		slidingMessageDiv.style.display = 'none';
		slidingMessageDiv.style.animation = 'none'; // Stop the animation
		slidingMessageDiv.removeEventListener('animationiteration', handleAnimationIteration);
	};
	// Add the event listener for the next animation iteration
	slidingMessageDiv.addEventListener('animationiteration', handleAnimationIteration);
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



function showPassword() {

	const togglePassword = document.querySelector("#togglePassword");
	const password = document.querySelector("#form1Example3");

	togglePassword.addEventListener("click", function () {
		// Alternar o tipo de entrada entre 'password' e 'text'
		const type = password.getAttribute("type") === "password" ? "text" : "password";
		password.setAttribute("type", type);

		// Alternar o ícone entre 'olho' aberto e fechado
		this.classList.toggle("bi-eye");
		this.classList.toggle("bi-eye-slash");
	});
}

export { displaySlidingMessage, limparDivAll, displayError, displayErrorSignIn, successContainer, logoutContainer, successContainerRegister, messageContainerToken, handleInput, handleInputBlur, clearSlidingMessage, showPassword };
