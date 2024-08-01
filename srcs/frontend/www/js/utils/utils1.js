
// limpa um elemento div - usado com o div do index - root
function limparDivAll(divId) {
	var div = document.getElementById(divId);
	if (div) {
		var children = div.childNodes;
		for (var i = children.length - 1; i >= 0; i--) {
			var child = children[i];
			console.log(child.id);
			div.removeChild(child);
		}
	} else {
		console.error("O elemento com o ID fornecido não foi encontrado.");
	}
}

// Mostra a  mensagem de erro após fetch no register
function displayError(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.textContent = `${errorMessage} Try again`;
	errorDiv.style.display = 'block'; // Mostra a div de erro
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

// Mostra a  mensagem de erro após fetch no login
function displayErrorSignIn(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.innerHTML = "";
	errorDiv.textContent = `${errorMessage}. Try again`;
	errorDiv.style.display = 'block'; // Mostra a div de erro
	const registerForm = document.querySelector('#userSignInForm');
	console.log(registerForm);
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

// Após logout mensagem de sucesso
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

// Após login mensagem de sucesso
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

// Após registo - mensagem de sucesso
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

// Após falha no token refresh - mensagem de sucesso
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

// De reserva desactiva os links, pode ser util na home page
function deactivateLinks(links) {
	console.log('desativar links', viewToken());
	if (!viewToken()) {
		for (let link of links) {
			if (link.dataset.value) {
				link.style.pointerEvents = 'none';
				link.style.cursor = 'default';
			}
		}
	}
}

export { limparDivAll, displayError, displayErrorSignIn, successContainer, logoutContainer, successContainerRegister, messageContainerToken }