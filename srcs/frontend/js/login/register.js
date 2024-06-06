import { limparDivAll, displayError } from "../utils/utils1.js";
import { register_page } from "../html/register_page.js";
import { saveToken, viewToken } from "./session.js";
import { getCsrfToken } from "../utils/csrf.js";
import { baseURL } from "../app.js";
import { signIn_page } from "../html/signin.js";
import { home, goHome, makeHomeLogin } from "../html/home.js";
import { displayPageError } from "../html/error_page.js";
import { userSignIn } from "./login.js";


////****************ReGISTO DO USER*****************************/


//INSERE A CLASSE DE VALIDAÇÃO DO CAMPOR BORDER RED
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


// FAZ O FETCH SE ESTIVER TUDO OK
function fetchRegister(user, email, password, password2, allURL, registerForm) {
	console.log(user, password, password2);
	registerUser(user, email, password, password2, allURL);
	registerForm.elements.username.value = "";
	registerForm.elements.email.value = "";
	registerForm.elements.password.value = "";
	registerForm.elements.password2.value = "";
}


// REMOVE A CLASSE DE VALIDAÇÃO -  FUNÇÂO NÃO USADA
function removeInputValidation(registerForm) {
	for (let element of registerForm.elements) {
		if (element.classList.contains('input-error'))
			element.classList.remove('input-error');
	}
}


function handleSignUp(e) {
    e.preventDefault();
	console.log(this.dataset.value);
    const registerForm = document.querySelector('#userRegisterForm');
    const allURL = `${baseURL}${this.dataset.value}`;
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


function signInPage(e) {
	e.preventDefault();
	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', signIn_page);
	const signInUser = document.querySelector('#signInUser');
	home();
	console.log(signInUser);
	signInUser.addEventListener('click', userSignIn);
}


// FUNÇÃO PRINCIPAL DE REGISTO - VEM DA PRIMEIRA PAGE
function register() {
	const butRegister = document.querySelector('#register');
	// console.log(butRegister);
	butRegister.addEventListener('click', function (e) {
		e.preventDefault();
		limparDivAll('root');
		// console.log(this.dataset.value);
		document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);
		const signIn = document.querySelector('#signInRegister');
		signIn.addEventListener('click', signInPage);
		home();
		const signUp = document.querySelector('#signUp');
		signUp.addEventListener('click', handleSignUp)
	})
};


function successContainer(success_message) {
	return `<div class="row justify-content-center my-auto">
	<div class="col-auto">
		<div class="success-message" id="successMessage" style="display: none; font-size: 30px;">Welcome ${success_message}</div>
	</div>
</div>`;
}


function showSuccessMessage() {
	var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	setTimeout(function() {
		messageDiv.style.display = 'none'; // Oculta a mensagem após 3 segundos
		makeHomeLogin(); // Redireciona para a página inicial após login
	}, 1000); // 1000 milissegundos = 1 segundos
}


// FUNÇÃO ASÍNCRONA DE REGITO DE USER
async function registerUser(user, email, password, password2, allURL) {
	const csrfToken = await getCsrfToken();
	// console.log(csrfToken);
	const dados = {
		username: user,
		email: email,
		password: password,
		confirm_password: password2,
	};
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

		if (!response.ok) {
			const errorData = await response.json(); // msn que vem do Django
			const errorObject = {
				message: errorData.error,
				status: response.status,
				status_msn: response.statusText
			}
			console.log(errorObject.message, errorObject.status, errorObject.status_msn);
			// console.log()
			throw errorObject;
		}

		const data = await response.json();
		console.log(data);
		console.log(data.access_token, data.refresh_token);
		saveToken(data.access_token, data.refresh_token);
		console.log('localstorage', viewToken());
		limparDivAll('root');
		const successDiv = successContainer(data.user);
		document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
		showSuccessMessage();

	} catch (e) {

		console.log(e.message, e.status, e.status_msn);
		if (e.status === 400) {
			const err_key = Object.keys(e.message)[0];
			const err_message = e.message[err_key];
			console.log(err_message);
			displayError(err_message);
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


export { register, successContainer, showSuccessMessage }
