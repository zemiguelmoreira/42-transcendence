
import { baseURL } from "../app.js";
import { signIn_page } from "./loginPage.js";
import { getCsrfToken } from "../utils/tokenCsrf.js";
import { displayErrorSignIn, successContainer } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { viewToken, testToken } from "../utils/tokens.js";
import { getNamebyId } from "../profile/myprofile.js";
import { fetchQrCode, displayQrCode, verifyCode, displayErrorCode } from "../2faQrcode/2fa_qrcode.js";
import { handleInput, handleInputBlur } from "../utils/utils1.js";
import { userSignIn42, getParams } from "./login42.js";
import { initializeChat } from "../chat/chat.js";
import { makeChatWindow } from "../chat/chat_html.js";
import WebSocketInstance from "../socket/websocket.js";

function insertInputValidation1(qrForm) {
	for (let element of qrForm.elements) {
		if (element.classList.contains('form-control') && !element.value) {
			element.classList.add('input-error');
		} else if (element.value) {
			if (element.classList.contains('input-error')) {
				element.classList.remove('input-error');
			}
		}
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
	if (userOrEmail1 && password1) {
		sendIUser(userOrEmail1, password1);
		userSignInForm.elements.username.value = "";
		userSignInForm.elements.password.value = "";
	} else {
		insertInputValidation1(userSignInForm);
	}
}

function showSuccessMessageSignIn(username) {
	let messageDiv = document.getElementById('successMessage');
	// var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block';
	setTimeout(function () {
		messageDiv.style.display = 'none';
		WebSocketInstance.connect();
		navigateTo(`/user/${username}`);
	}, 1000);
}

function signIn() {
	document.getElementById('root').innerHTML = "";
	document.getElementById('root').insertAdjacentHTML('afterbegin', signIn_page);
	document.getElementById('form1Example1').focus();
	const inputField = document.querySelector('#form1Example1');
	const limitChar = document.querySelector('#limitChar2');

	handleInput(inputField, limitChar);
	handleInputBlur(inputField, limitChar);

	const signInUser = document.querySelector('#signInUser');
	signInUser.addEventListener('click', userSignIn);

	document.getElementById('backButton').addEventListener('click', function (e) {
		e.preventDefault();
		navigateTo('/');
	});

	document.getElementById('backToSignIn').addEventListener('click', function (e) {
		e.preventDefault();
		window.history.back();
	});

	document.getElementById('sendPassword').addEventListener('click', function (e) {
		e.preventDefault();
		const emailField = document.getElementById('resetEmail');
    
		// Verifica se o campo de email está vazio
		if (!emailField.value) {
			emailField.classList.add('input-error'); // Adiciona a classe de erro se estiver vazio
			e.preventDefault(); // Impede o envio do formulário
		} else {
			emailField.classList.remove('input-error'); // Remove a classe de erro se o campo estiver preenchido
			// Aqui pode seguir com o envio do formulário
			resetPassword();
			navigateTo('/');
		}
	});


	const signInForm = document.getElementById("userSignInForm");
    const qrCodeForm = document.getElementById("qrCodeForm");
    const passwordResetForm = document.getElementById("requestPasswordResetForm");

	document.getElementById("recover").addEventListener("click", function (e) {
		e.preventDefault(); // Evita o comportamento padrão do link

		// Ocultar outros formulários
		if (signInForm) signInForm.style.display = "none";
		if (qrCodeForm) qrCodeForm.style.display = "none";

		// Exibir o formulário de recuperação de senha
		if (passwordResetForm) passwordResetForm.style.display = "block";

	});
}

async function sendIUser(userOrEmail, password) {
	const info = { username: userOrEmail, password: password };
	const conf = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(info),
	};
	try {
		const signInUser42 = document.querySelector('#signInUser42');
		signInUser42.addEventListener('click', function (e) {
			e.preventDefault();
			if (!viewToken())
				userSignIn42();
			else
				displayError("To login with another user, you have to logout.");
		});
		const response = await fetch(`${baseURL}/token/`, conf);
		if (!response.ok) {
			const errorData = await response.json();
			const errorObject = {
				message: errorData.detail,
				status: response.status,
			};
			throw errorObject;
		}
		const data = await response.json();
		sessionStorage.setItem('access_token', data.access);
		localStorage.setItem('refresh_token', data.refresh);
		const payload = testToken(data.access);
		let username = await getNamebyId(payload.user_id);
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
			if (code) {
				try {
					const result = await verifyCode(userOrEmail, code);
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
						sessionStorage.removeItem('access_token');
						showSuccessMessageSignIn(username);
					} else {
						sessionStorage.removeItem('access_token');
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

async function resetPassword() {
	const currentPassword = document.getElementById('currentPassword').value;
	const newPassword = document.getElementById('newPassword').value;
	const confirmNewPassword = document.getElementById('confirmNewPassword').value;

	if (newPassword !== confirmNewPassword) {
		alert('A nova senha e a confirmação não coincidem.');
		return;
	}

	try {
		const response = await fetch('/api/user/reset-password/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),  // Supondo que o token esteja salvo no localStorage
			},
			body: JSON.stringify({
				current_password: currentPassword,
				new_password: newPassword,
				confirm_password: confirmNewPassword,
			}),
		});

		const data = await response.json();
		if (response.ok) {
			alert('Senha trocada com sucesso!');
		} else {
			if (data.error) {
				console.error(data.error.message);
				alert(data.error.message);
			} else {
				alert('Erro ao trocar a senha. Verifique seus dados e tente novamente.');
			}
		}
	} catch (error) {
		console.error('Erro ao trocar a senha:', error.message);
		alert('Ocorreu um erro. Tente novamente mais tarde.');
	}
}

export { signIn, userSignIn, resetPassword }