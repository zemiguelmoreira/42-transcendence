import { limparDivAll } from "../utils/utils1.js";
import { baseURL } from "../app.js";
import { signIn_page } from "../html/signin.js";
import { getCsrfToken } from "../utils/csrf.js";
import { home } from "../html/home.js";
import { displayError, displayErrorSignIn } from "../utils/utils1.js";
import { displayPageError } from "../html/error_page.js";
import { successContainer, showSuccessMessage } from "./register.js";
import { goHome } from "../html/home.js";
import { saveToken, viewToken } from "./session.js";

let userName = "";

function insertInputValidation1(userSigInForm) {
	for (let element of userSigInForm.elements) {
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


function userSignIn(e) {
	e.preventDefault();
	console.log(this.dataset.value);
    const userSignInForm = document.querySelector('#userSignInForm');
	const allURL = `${baseURL}${this.dataset.value}`;
	console.log(allURL);
	const userOrEmail1 = userSignInForm.elements.username.value;
	const password1 = userSignInForm.elements.password.value;
	console.log(userOrEmail1, password1);
	if (userOrEmail1 && password1) {
        sendIUser(userOrEmail1, password1, allURL);
		userSignInForm.elements.username.value = "";
		userSignInForm.elements.password.value = "";
    } else {
        insertInputValidation1(userSignInForm);
	}
}


function handleSignIn(e) {
	e.preventDefault();
	
	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', signIn_page);
	const signInUser = document.querySelector('#signInUser');
	home();
	// console.log(signInUser);
	signInUser.addEventListener('click', userSignIn);
	
}

// o id está na navbar.js

function signIn() {
	const butSign = document.querySelector('#signIn');
	// console.log(butSign);
	butSign.addEventListener('click', handleSignIn);
};


async function sendIUser(userOrEmail, password, allURL) {
	const csrfToken = await getCsrfToken();
	const dados = {
		username: userOrEmail,
		password: password
	};
	// const queryString = new URLSearchParams(dados).toString();
	const configuracao = {
		method: 'POST',
		headers: { 
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
		 },
		body: JSON.stringify(dados),
		// body: queryString,
	};
	// const response = await fetch(allURL, configuracao);
	// const data = await response.json();
	// console.log(data);

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
			throw errorObject;
		}

		const data = await response.json();
		console.log(data);
		console.log(data.access_token, data.refresh_token);
		saveToken(data.access_token, data.refresh_token);
		console.log('localstorage', viewToken());
		limparDivAll('root');
		userName = data.user.username;
		const successDiv = successContainer(data.user.username);
		document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
		showSuccessMessage();
	} catch (e) {
		console.log(e.message, e.status, e.status_msn);
		if (e.status === 400){
			displayErrorSignIn(e.message);
		}
		else {
			const makeError = displayPageError(e.status, e.message);
			document.getElementById('root').innerHTML = ''; //só teste
			document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
			const home_error = document.getElementById('a_error');
			home_error.addEventListener('click', goHome);
		}
	}

};


export { userName, signIn, userSignIn }