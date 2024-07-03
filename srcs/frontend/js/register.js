import { getCsrfToken } from "./utils/csrf.js";

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
function register() {
    document.getElementById('signInRegister').addEventListener('click', (e) => {
		e.preventDefault();
		windows.load('login');
    });

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		windows.load('login');
    });

	const signUp = document.querySelector('#signUp');
	signUp.addEventListener('click', handleSignUp)

};

// FUNÇÃO ASÍNCRONA DE REGITO DE USER
async function registerUser(user, email, password, password2) {
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
	try {
		const response = await fetch('/user/profile/create/', configuracao);

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
		window.loadPage('login', false);
	} catch (e) {

		console.log(e.message, e.status, e.status_msn);
		if (e.status === 400) {
			const err_key = Object.keys(e.message)[0];
			const err_message = e.message[err_key];
			console.log(err_message);
		}

		else {
			navigateTo(`/error/${e.status}/${e.message}`);
		}
	}
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
} else {
    register();
}