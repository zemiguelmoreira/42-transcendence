import { getCsrfToken } from '../../utils/csrf.js';
import { saveToken } from '../../authentication_utils/session.js';

let location = true;

function displayErrorSignIn(errorMessage) {
	const errorDiv = document.getElementById('error-message');
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

// function insertInputValidation(sigInForm) {
// 	for (let element of sigInForm.elements) {
// 		console.log(element);
// 		// Verifica se o elemento é do tipo input e tem a classe 'form-control'
// 		if (element.className === 'form-control' && !element.value) {
// 			const signInUser = document.querySelector('#signInUser');
// 			console.log(signInUser);
// 			signInUser.addEventListener('click', userSignIn);
// 		}
// 	}
// }

function handleSignIn(e) {
	e.preventDefault();
	const allURL = `${this.dataset.value}`;
	const signInForm = document.querySelector('#userSignInForm');
	const userOrEmail = signInForm.elements.username.value;
	const password = signInForm.elements.password.value;
	console.log(userOrEmail, password);
	if (userOrEmail && password) {
        sendIUser(userOrEmail, password, allURL, location);
		signInForm.elements.username.value = "";
		signInForm.elements.password.value = "";
	}
    // } else {
    //     insertInputValidation(signInForm);
    // }
}

async function sendIUser(userOrEmail, password, allURL, location) {
	const csrfToken = await getCsrfToken();
	const dados = {
		username: userOrEmail,
		password: password
	};
	const configuracao = {
		method: 'POST',
		headers: { 
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
		 },
		body: JSON.stringify(dados),
	};

	try {
		const response = await fetch(allURL, configuracao);

		if (!response.ok) {
			const errorData = await response.json();
			const errorObject = {
				message: errorData.error,
				status: response.status,
				status_msn: response.statusText
			}
			console.log(errorObject.message, errorObject.status, errorObject.status_msn);
			throw errorObject;
		}

		const data = await response.json();
		saveToken(data.token, data.user.username);
		loadPage('home');
	} catch (e) {
		console.log(e.message, e.status, e.status_msn);
		if (e.status === 400){
			displayErrorSignIn(e.message);
		}
	}
};

const butSign = document.querySelector('#signInBtn');
butSign.addEventListener('click', handleSignIn);