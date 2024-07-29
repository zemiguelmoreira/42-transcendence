import { limparDivAll, displayError } from "../utils/utils1.js";
import { register_page } from "./registerPage.js";
import { getCsrfToken } from "../utils/tokenCsrf.js";
import { baseURL, navigateTo } from "../app.js";
import { successContainerRegister } from "../utils/utils1.js";


////****************ReGISTO DO USER*****************************/


//INSERE A CLASSE DE VALIDAÇÃO DO CAMPO - BORDER RED
function insertInputValidation(registerForm) {
	for (let element of registerForm.elements) {
		console.log(element);

		// Verifica se o elemento é do tipo input e tem a classe 'form-control'
		if (element.classList.contains('form-control') && !element.value) {
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
function fetchRegister(user, email, password, password2, registerForm) {
	console.log(user, password, password2);
	registerUser(user, email, password, password2);
	registerForm.elements.username.value = "";
	registerForm.elements.email.value = "";
	registerForm.elements.password.value = "";
	registerForm.elements.password2.value = "";
}


function handleSignUp(e) {
    e.preventDefault();
    const registerForm = document.querySelector('#userRegisterForm');
    const user = registerForm.elements.username.value;
	console.log(user);
    const email = registerForm.elements.email.value;
    const password = registerForm.elements.password.value;
    const password2 = registerForm.elements.password2.value;
    if (user && email && password && password2) {
        fetchRegister(user, email, password, password2, registerForm);
    } else {
        insertInputValidation(registerForm);
    }
}


// FUNÇÃO PRINCIPAL DE REGISTO - VEM DA PRIMEIRA PAGE
// function register() {

// 	limparDivAll('root');
// 	document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);
// 	document.getElementById('form1Example1').focus(); // colocar focus no primeiro campo de entrada

// 	document.getElementById('signInRegister').addEventListener('click', (e) => {
// 		e.preventDefault();
// 		navigateTo('/signIn');});

// 	document.getElementById('home').addEventListener('click', (e) => {
// 		e.preventDefault();
// 		navigateTo('/');});

// 	const signUp = document.querySelector('#signUp');
// 	signUp.addEventListener('click', handleSignUp)

// };


function showSuccessMessageRegister() {
	var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	setTimeout(function() {
		messageDiv.style.display = 'none';
		navigateTo(`/signIn`);
	}, 2000); // 1000 milissegundos = 1 segundos
}


// FUNÇÃO ASÍNCRONA DE REGITO DE USER
async function registerUser(user, email, password, password2) {

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
    //     console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - register',
    //             status: 401,
    //             status_msn: 'CSRF token not found'
    //         };
    //     }
    // } catch (error) {
    //     console.log(error.message, error.status, error.status_msn);
    //     navigateTo(`/error/${error.status}/${error.message}`);
    //     return;
    // }

	// console.log(csrfToken);
	const dados = {
		username: user,
		email: email,
		password: password,
		confirm_password: password2,
	};
	const configuracao = {
		method: 'POST',
		headers: {
			// 'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Type': 'application/json',
			// 'X-CSRFToken': csrfToken,
		},
		body: JSON.stringify(dados),
		// credentials: 'include',
	};

	try {

		const response = await fetch(`${baseURL}/user/register/`, configuracao);
		console.log('response: ', response);

		if (!response.ok) {
			const errorData = await response.json(); // msn que vem do Django (serializer)
			console.log('errorData: ', errorData);
            const message = Object.values(errorData)[0];
			const input = Object.keys(errorData)[0];// só para controlo na consola
			console.log('message: ', message);
			console.log('input: ', input);
			const errorObject = {
				message: message,
				status: response.status,
				status_msn: response.statusText
			}
			// console.log(errorObject.message, errorObject.status, errorObject.status_msn);
			throw errorObject;
		}

		const data = await response.json();
		console.log('data register: ', data);
		limparDivAll('root');
		const successDiv = successContainerRegister(data.username);
		document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
		showSuccessMessageRegister();

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
		}
	}
};


export { handleSignUp }
