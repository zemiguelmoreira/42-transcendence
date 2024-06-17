import { limparDivAll, displayError } from "../utils/utils1.js";
import { register_page } from "../html/register_page.js";
import { saveToken, viewToken } from "./session.js";
import { getCsrfToken } from "../utils/csrf.js";
import { baseURL } from "../app.js";
import { signIn_page } from "../html/signin.js";
// import { home, goHome, makeHomeLogin } from "../html/home.js";
import { displayPageError } from "../html/error_page.js";
import { userSignIn } from "./login.js";
import { navigateTo } from "../app.js";

let userNameReg = "";

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


// FUNÇÃO PRINCIPAL DE REGISTO - VEM DA PRIMEIRA PAGE
function register() {

	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);

	document.getElementById('signInRegister').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/signIn');});

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');});

	const signUp = document.querySelector('#signUp');
	signUp.addEventListener('click', handleSignUp)

};


function successContainer(success_message) {
	return `<div class="row justify-content-center my-auto">
	<div class="col-auto">
		<div class="success-message" id="successMessage" style="display: none; font-size: 30px;">Welcome ${success_message}</div>
	</div>
</div>`;
}


function showSuccessMessage(username) {
	var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	setTimeout(function() {
		messageDiv.style.display = 'none';
		console.log(userNameReg);
		navigateTo(`/user/${username}`);
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
		userNameReg = dados.username;
		const data = await response.json();
		console.log(data);
		console.log(data.access_token, data.refresh_token);
		saveToken(data.access_token, data.refresh_token);
		console.log('localstorage', viewToken());
		limparDivAll('root');
		const successDiv = successContainer(data.user);
		document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
		if (viewToken())
			showSuccessMessage(dados.username);
		else
			throw {
				message: 'Something went wrong',
				status: 401,
				status_msg: 'Internal Server Error - Tokens'
			};

	} catch (e) {

		console.log(e.message, e.status, e.status_msn);
		if (e.status === 400) {
			const err_key = Object.keys(e.message)[0];
			const err_message = e.message[err_key];
			console.log(err_message);
			displayError(err_message);
		}

		else {
			navigateTo(`/error/${e.status}/${e.message}`);
		// 	const home_error = document.getElementById('a_error'); //falta colocar isto na app.js
		// 	home_error.addEventListener('click', goHome);
		}
	}
};


export { userNameReg, register, successContainer, showSuccessMessage }
