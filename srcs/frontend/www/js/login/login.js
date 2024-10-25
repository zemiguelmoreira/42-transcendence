import { baseURL } from "../app.js";
import { signIn_page } from "./loginPage.js";
import { displayErrorSignIn, displaySlidingMessage, successContainer } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { viewToken, testToken, saveToken } from "../utils/tokens.js";
import { getNamebyId } from "../profile/myprofile.js";
import { fetchQrCode, displayQrCode, verifyCode, displayErrorCode } from "../2faQrcode/2fa_qrcode.js";
import { handleInput, handleInputBlur, showPassword, displayError } from "../utils/utils1.js";
import { userSignIn42, getParams } from "./login42.js";

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

async function checkTwoFactorStatus(username) {
    const url = `/api/check-2fa-status/${username}/`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("User not found");
        }
        const data = await response.json();
        return data.two_factor_enabled;
    } catch (error) {
        return false;
    }
}

function userSignIn(e) {
	e.preventDefault();
	const userSignInForm = document.querySelector('#userSignInForm');
	const userOrEmail1 = userSignInForm.elements.username.value.toLowerCase().trim();
	console.log('username no signIn: ', userOrEmail1);
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
	messageDiv.style.display = 'block';
	setTimeout(function () {
		messageDiv.style.display = 'none';
		navigateTo(`/user/${username}`);
	}, 1000);
}

function signIn() {
	document.getElementById('root').innerHTML = "";
	document.getElementById('root').insertAdjacentHTML('afterbegin', signIn_page);
	document.getElementById('form1Example1').focus();

	const inputField = document.querySelector('#form1Example1');
	const limitChar = document.querySelector('#limitChar2');

	showPassword("togglePassword", "form1Example3");

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
		navigateTo('/signIn');
	});

	const signInForm = document.getElementById("userSignInForm");
	const qrCodeForm = document.getElementById("qrCodeForm");
	const passwordResetForm = document.getElementById("requestPasswordResetForm");

	document.getElementById("recover").addEventListener("click", function (e) {
		e.preventDefault();

		if (signInForm) signInForm.style.display = "none";
		if (qrCodeForm) qrCodeForm.style.display = "none";

		if (passwordResetForm)
			passwordResetForm.style.display = "block";

		document.getElementById('resetEmail').focus();

		document.getElementById('sendPassword').addEventListener('click', function (e) {
			e.preventDefault();
			requestPasswordReset();
		});

	});

	const signInUser42 = document.querySelector('#signInUser42');
	signInUser42.addEventListener('click', function (e) {
		e.preventDefault();
		if (!viewToken())
			userSignIn42();
		else
			displayErrorSignIn("To login with another user, you have to logout.");
	});
}

async function sendIUser(userOrEmail, password) {
	const isTwoFactorEnabled = await checkTwoFactorStatus(userOrEmail);
	console.log(isTwoFactorEnabled);
	const info = { username: userOrEmail, password: password };
	console.log(info);
    const conf = {
		method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
    };
	
	if (isTwoFactorEnabled)
	{
		try {
	
			const response = await fetch(`${baseURL}/token/`, conf);
			let errorObject;
			if (!response.ok) {
				if (response.status === 401) {
					const errorData = await response.json();
					console.log('errorData login: ', errorData);
					console.log('errorData login: ', errorData.detail);
					errorObject = {
						message: errorData.detail,
						status: response.status,
					};
				} else {
					errorObject = {
						message: response.statusText,
						status: response.status,
					};
				}
				throw errorObject;
			}
	
			const data = await response.json();
			sessionStorage.setItem('access_token', data.access);
			localStorage.setItem('refresh_token', data.refresh);
	
			const payload = testToken(data.access);
			let username = await getNamebyId(payload.user_id);
			if (username.status) {
				navigateTo(`/error/${username.status}/${username.message}`);
				return;
			}
	
			const qr_code = await fetchQrCode();
			if (qr_code) {
				displayQrCode(qr_code);
			} else {
				throw { message: 'Something went wrong - qrCode not found', status: 404 };
			}
	
			const submitCode = document.querySelector('#verifyQrCode');
			const qrForm = document.querySelector('#qrCodeForm');
			submitCode.addEventListener('click', async function (e) {
				e.preventDefault();
				const code = qrForm.elements.qrCode.value;
				if (code) {
					try {
	
						const result = await verifyCode(userOrEmail, code);
						if (result.status) {
							if (result.status === 400)
								throw { message: 'Invalid or expired 2FA code', status: 400 };
							else
								throw { message: result.message, status: result.status };
						}
	
						qrForm.elements.qrCode.value = "";
						document.querySelector('#qr-code').innerHTML = "";
						document.getElementById('qrCodeForm').style.display = 'none';
						document.getElementById('userSignInForm').style.display = "block";
						document.getElementById('root').innerHTML = "";
						const successDiv = successContainer(username);
						document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
						if (viewToken()) {
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
							localStorage.removeItem('access_token');
							sessionStorage.removeItem('access_token');
							localStorage.removeItem('refresh_token');
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
	} else {
		const url = `${baseURL}/token/no-2fa/`;
		const credentials = {
			username: userOrEmail,
			password: password,
		};

		const config = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(credentials),
		};

		try {
			const response = await fetch(url, config);
			let errorObject;
			if (!response.ok) {
				if (response.status === 401) {
					const errorData = await response.json();
					console.log('errorData login: ', errorData);
					console.log('errorData login: ', errorData.detail);
					errorObject = {
						message: errorData.detail,
						status: response.status,
					};
				} else {
					errorObject = {
						message: response.statusText,
						status: response.status,
					};
				}
				throw errorObject;
			}

			const data = await response.json();
			saveToken(data.access, data.refresh);

			const successDiv = successContainer(userOrEmail);
			document.getElementById('root').innerHTML = "";
			document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
			if (viewToken()) {
				showSuccessMessageSignIn(userOrEmail);
			} else {
				sessionStorage.removeItem('access_token');
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				throw { message: `User ${userOrEmail} not validated - bad request`, status: 404 };
			}
			console.log('Login successful:', data);
			return data;

		} catch (e) {
			if (e.status === 401) {
				displayErrorSignIn(e.message);
			} else {
				navigateTo(`/error/${e.status}/${e.message}`);
			}
		}													
	}

}

async function resetPassword(username) {
	const currentPassword = document.getElementById('currentPassword');
	const newPassword = document.getElementById('newPassword');
	const confirmNewPassword = document.getElementById('confirmNewPassword');

	let hasError = false;

	if (!currentPassword.value) {
		currentPassword.classList.add('input-error');
		hasError = true;
	} else {
		currentPassword.classList.remove('input-error');
	}

	if (!newPassword.value) {
		newPassword.classList.add('input-error');
		hasError = true;
	} else {
		newPassword.classList.remove('input-error');
	}

	if (!confirmNewPassword.value) {
		confirmNewPassword.classList.add('input-error');
		hasError = true;
	} else {
		confirmNewPassword.classList.remove('input-error');
	}

	if (hasError) {
		return;
	}

	if (newPassword.value !== confirmNewPassword.value) {
		displaySlidingMessage("Passwords don't match.");
		return;
	}

	try {
		const response = await fetch('/api/user/reset-password/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
			},
			body: JSON.stringify({
				current_password: currentPassword.value,
				new_password: newPassword.value,
				confirm_password: confirmNewPassword.value,
			}),
		});

		const data = await response.json();
		if (response.ok) {
			displaySlidingMessage('Password updated with success!');
			navigateTo(`/user/${username}/settings`);
		} else {
			if (data.error) {
				displaySlidingMessage("Invalid Password");
			} else {
				displaySlidingMessage('Error updating password. Please check your data and try again.');
			}
		}
	} catch (error) {
	}
}

function displayErrorReqPassword(errorMessage) {
	const errorDiv = document.getElementById('error-message-password');
	errorDiv.innerHTML = "";
	errorDiv.textContent = `${errorMessage} Try again`;
	errorDiv.style.display = 'block';
	document.getElementById('resetEmail').focus();
	const registerForm = document.querySelector('#requestPasswordResetForm');
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

async function requestPasswordReset() {

	const email = document.getElementById('resetEmail').value;
	const passwordResetForm = document.getElementById("requestPasswordResetForm");
	document.getElementById('resetEmail').value = '';

		if (email) {
			try {
					const response = await fetch('/api/user/request-password-reset/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							email: email,
						}),
					});

					console.log('response: ', response);
					let errorObject;
					let data;

					if (response.ok) {
						data = await response.json();
						console.log('data no recup password: ', data);
						navigateTo('/signIn');
					} else {
						if (response.status === 400) {
							data = await response.json();
							errorObject = {
								message: data.error.message,
								status: response.status,
							};
						} else {
							errorObject = {
								message: response.statusText,
								status: response.status,
							};
						}
						throw errorObject;
					}
			} catch (e) {
				console.log('Erro ao solicitar recuperação de senha:', e.message);
				if (e.status === 400){
					console.log('teste passei aqui');
					displayErrorReqPassword(e.message);
				} else {
					navigateTo(`/error/${e.status}/${e.message}`);
				}
			}
		} else {
			insertInputValidation1(passwordResetForm);
		}
}


async function deleteUser() {
	
	const accessToken = localStorage.getItem('access_token');

	if (!accessToken) {
		alert('You are not logged in!');
		return;
	}

	const confirmed = confirm('Are you sure you want to delete your account? \nThis action cannot be undone.');

	if (!confirmed) {
		console.log('FALSE');
		return false;
	}


	try {
		const response = await fetch('/api/profile/delete_user/', {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (response.status === 204) {
			alert('User deleted successfully');
			// localStorage.removeItem('access_token');
			// localStorage.removeItem('refresh_token');
		} else {
			const data = await response.json();
			alert(data.error || 'Failed to delete user');
			console.log('FALSE');
			return false;
		}
	} catch (error) {
		alert('Failed to delete user');
		console.log('FALSE');
		return false;
	}
	
	console.log('TRUE');
	return true;
}

export { signIn, userSignIn, resetPassword, deleteUser , checkTwoFactorStatus }
