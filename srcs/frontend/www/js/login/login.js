import { limparDivAll } from "../utils/utils1.js";
import { baseURL } from "../app.js";
import { signIn_page } from "./loginPage.js";
import { getCsrfToken } from "../utils/tokenCsrf.js";
import { displayErrorSignIn, successContainer } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { saveToken, viewToken, testToken } from "../utils/tokens.js";
import { getNamebyId } from "../profile/myprofile.js";
import { fetchQrCode, displayQrCode, verifyCode, displayErrorCode } from "../2faQrcode/2fa_qrcode.js";
import WebSocketInstance from "../socket/websocket.js";
import { goTo } from "../app.js";


function insertInputValidation1(userSigInForm) {
	for (let element of userSigInForm.elements) {
		// console.log('elemento no validation: ', element);
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

function userSignIn(e) {
	e.preventDefault();
	const userSignInForm = document.querySelector('#userSignInForm');
	const userOrEmail1 = userSignInForm.elements.username.value;
	const password1 = userSignInForm.elements.password.value;
	// console.log(userOrEmail1, password1);
	if (userOrEmail1 && password1) {
		sendIUser(userOrEmail1, password1);
		userSignInForm.elements.username.value = "";
		userSignInForm.elements.password.value = "";
	} else {
		insertInputValidation1(userSignInForm);
	}
}

function showSuccessMessageSignIn(username) {
	var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	setTimeout(function () {
		messageDiv.style.display = 'none';
		WebSocketInstance.connect();
		navigateTo(`/user/${username}`);
	}, 1000); // 1000 milissegundos = 1 segundos
}

function signIn() {

	if (!localStorage.getItem('access_token')) {
		document.getElementById('root').innerHTML = "";
		document.getElementById('root').insertAdjacentHTML('afterbegin', signIn_page);

		// document.getElementById('home').addEventListener('click', (e) => {
		//     e.preventDefault();
		//     navigateTo('/');
		// });

		const signInUser = document.querySelector('#signInUser');
		signInUser.addEventListener('click', userSignIn);
		document.getElementById('backButton').addEventListener('click', function () {
			e.preventDefault();
			navigateTo('/');
		});
	}
	else {
		goTo();
	}
}

async function sendIUser(userOrEmail, password, allURL) {
	const dados = { username: userOrEmail, password: password };
	const conf = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(dados),
	};
	try {
		const response = await fetch(`${baseURL}/token/`, conf);
		// console.log('response login: ', response);
		if (!response.ok) {
			const errorData = await response.json();
			// console.log('errorData login: ', errorData.detail);
			const errorObject = {
				message: errorData.detail,
				status: response.status,
			};
			// console.log(errorObject.message, errorObject.status);
			throw errorObject;
		}
		const data = await response.json();
		// console.log('data login: ', data);
		saveToken(data.access, data.refresh);
		// console.log('localstorage', viewToken());
		const payload = testToken(data.access);
		// console.log(payload);
		let username = await getNamebyId(payload.user_id);
		// console.log(username);
		const qr_code = await fetchQrCode();
		if (qr_code) {
			displayQrCode(qr_code);
		} else {
			throw { message: 'Something went wrong - qrCode', status: 401 };
		}
		const submitCode = document.querySelector('#verifyQrCode');
		const qrForm = document.querySelector('#qrCodeForm');
		submitCode.addEventListener('click', async function (e) {
			e.preventDefault();
			const code = qrForm.elements.qrCode.value;
			// console.log('teste o code é: ', code);
			if (code) {
				try {
					const result = await verifyCode(userOrEmail, code); // após verificação colocar os campos do qrCodeForm a zero
					// console.log('result status: ', result.status); // se não validar o result será um erro
					if (result.status && result.status === 400)
						throw { message: 'Invalid or expired 2FA code', status: 400 };
					qrForm.elements.qrCode.value = "";
					document.querySelector('#qr-code').innerHTML = "";
					document.getElementById('qrCodeForm').style.display = 'none';
					document.getElementById('userSignInForm').style.display = "block";
					document.getElementById('root').innerHTML = "";
					const successDiv = successContainer(username);
					document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
					if (viewToken()) {
						showSuccessMessageSignIn(username);
						// Adiciona o conteúdo de home_page após o login bem-sucedido
					} else {
						throw { message: `User ${username} not validated - bad request`, status: 404 };
					}
				} catch (e) {
					if (e.status === 400) {
						displayErrorCode(e.message);
					} else {
						navigateTo(`/error/${e.status}/${e.message}`);
					}
				}
			} else {
				insertInputValidation1(qrForm);
			}
		});
	} catch (e) {
		if (e.status === 401) {
			displayErrorSignIn(e.message);
		} else {
			navigateTo(`/error/${e.status}/${e.message}`);
		}
	}
}

export { signIn, userSignIn }