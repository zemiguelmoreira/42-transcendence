import { getCsrfToken } from '../../utils/csrf.js';
import { saveToken } from '../../authentication_utils/session.js';


function displayError(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.textContent = `${errorMessage}. Try again`;
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

function insertInputValidation(registerForm) {
	for (let element of registerForm.elements) {
		console.log(element);

		// Verifica se o elemento é do tipo input e tem a classe 'form-control'
		if (element.className === 'form-control' && !element.value) {
			element.classList.add('input-error');
		} else if (element.value) {
			if (element.classList.contains('input-error')) {
				element.classList.remove('input-error');
			}
		}

		// Adiciona um listener para o evento de entrada (input)
		if (element.classList.contains('form-control')) {
			element.addEventListener('input', function () {
				if (element.value) {
					element.classList.remove('input-error');
				}
			});
		}
	}
}

function fetchRegister(user, email, password, password2, allURL, registerForm) {
	console.log(user, password, password2);
	registerUser(user, email, password, password2, allURL);
	registerForm.elements.username.value = "";
	registerForm.elements.email.value = "";
	registerForm.elements.password.value = "";
	registerForm.elements.password2.value = "";
}

function handleSignUp(e) {
    e.preventDefault();
	console.log(this.dataset.value);
    const registerForm = document.querySelector('#userRegisterForm');
    const allURL = `${this.dataset.value}`;
	console.log(allURL);
    const user = registerForm.elements.username.value;
	console.log(user);
    const email = registerForm.elements.email.value;
    const password = registerForm.elements.password.value;
    const password2 = registerForm.elements.password2.value;
    if (user && email && password && password2) {
        fetchRegister(user, email, password, password2, allURL, registerForm);
    } else {
        insertInputValidation(registerForm);
    }
}

async function registerUser(user, email, password, password2, allURL) {

    const dados = {
        username: user,
		email: email,
		password: password,
		confirm_password: password2,
        };
	console.log("DADOS:")
	console.log(dados);
    const csrfToken = await getCsrfToken();
    console.log(csrfToken);
	// Converter os dados em uma string de consulta
	// const queryString = new URLSearchParams(dados).toString();//  util no form
	const configuracao = {
		method: 'POST',
		headers: {
			// 'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken,
		},
		body: JSON.stringify(dados),
		// body: queryString, // não podemos enviar os dados como Json porque não vai preencher o form no Django
		credentials: 'include',
	};
	// console.log(response);
	try {
		const response = await fetch(allURL, configuracao);
		// const data = await response.json();

		if (!response.ok) {
			const errorData = await response.json(); // msn que vem do Django
			const errorObject = {
				message: errorData.error,
				status: response.status,
				status_msn: response.statusText
			}
			console.log(errorObject.message, errorObject.status, errorObject.status_msn);
			throw errorObject.message;
		}

		const data = await response.json();
		// console.log(data);
		// console.log(data.token, data.user);
		saveToken(data.token, data.user);
		// console.log('localstorage', viewToken());
		loadPage('signin');
	} catch (e) {
		console.log(e.message, e.status, e.status_msn);
		if (e.status === 400){
			displayError(e.message);
		}
		// else {
		// 	const makeError = displayPageError(e.status, e.message);
		// 	document.getElementById('root').innerHTML = ''; //só teste
		// 	document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
		// 	const home_error = document.getElementById('a_error');
		// 	home_error.addEventListener('click', goHome);
		// }
	}
	
};

const signUp = document.querySelector('#signUpBtn');
signUp.addEventListener('click', handleSignUp);
