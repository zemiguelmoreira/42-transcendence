import { limparDivAll } from "../utils/utils1.js";
import { register_page } from "./register_page.js";
import { saveToken, saveTokenCookie, viewToken, viewTokenCookie } from "./session.js";
import { getCsrfToken } from "../utils/csrf.js";


//const baseURL = "http://127.0.0.1:8000";
const baseURL = "https://localhost/api/users";

function signIn() {
	const butSign = document.querySelector('#signIn');
	// console.log(butSign);
	butSign.addEventListener('click', function (e) {
		e.preventDefault();
		console.log(this.dataset.value);
		const allURL = `${baseURL}${this.dataset.value}`;
		const signInForm = document.querySelector('#userForm');
		// console.log(signInForm);
		const user = signInForm.elements.username.value;
		const password = signInForm.elements.password.value;
		console.log(user, password);
		// getCSRFToken();
		sendIUser(user, password, allURL);
	})
};


async function sendIUser(user, password, allURL) {
	const dados = {
		username: user,
		password: password
	};
	
	const configuracao = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(dados)
	};

	const response = await fetch(allURL, configuracao);
	const data = await response.json();
	console.log(data);
};


function register() {
	const butRegister = document.querySelector('#register');
	// console.log(butRegister);
	butRegister.addEventListener('click', function (e) {
		e.preventDefault();
		limparDivAll('root');
		// console.log(this.dataset.value);
		document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);
		// console.log(document.getElementById('root'));
		const signUp = document.querySelector('#signIn');
		signUp.addEventListener('click', function(e) {
			e.preventDefault();
			console.log(this.dataset.value);
			const allURL = `${baseURL}${this.dataset.value}`;
			console.log(allURL);
			const registerForm = document.querySelector('#userRegisterForm');
			console.log(registerForm);
			const user = registerForm.elements.username.value;
			console.log(user);
			const password = registerForm.elements.password.value;
			const password2 = registerForm.elements.password2.value;
			console.log(user, password, password2);
			registerUser(user, password, password2, allURL);
			registerForm.elements.username.value = "";
			registerForm.elements.password.value = "";
			registerForm.elements.password2.value = "";
		})
	})
};


async function registerUser(user, password, password2, allURL) {
	const csrfToken = await getCsrfToken();
	// console.log(csrfToken);
	const dados = {
		username: user,
		first_name: "tot1",
		last_name: "toto",
		email: "teste@abc3.com",
		password: password,
		confirm_password: password2,
	};
	// Converter os dados em uma string de consulta
	const queryString = new URLSearchParams(dados).toString();
	const configuracao = {
		method: 'POST',
		headers: { 
			'Content-Type': 'application/x-www-form-urlencoded',
			 'X-CSRFToken': csrfToken,
		 },
		// body: JSON.stringify(dados)
		body: queryString, // não podemos enviar os dados como Json porque não vai preencher o form no Django
		credentials: 'include',
	};
	// console.log(response);
	const response = await fetch(allURL, configuracao);
	const data = await response.json();
	// console.log(data);
	console.log(data.token, data.user);
	saveToken(data.token, data.user);
	saveTokenCookie(data.token, data.user);
	console.log('localstorage', viewToken());
	console.log('cookie', viewTokenCookie());
};


export { signIn, register }