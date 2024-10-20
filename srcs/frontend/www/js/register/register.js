import { displayError } from "../utils/utils1.js";
import { baseURL, navigateTo } from "../app.js";
import { displayEmailCode, submitEmailCode } from "./emailCode.js";

function insertInputValidation(registerForm) {
	for (let element of registerForm.elements) {
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

function fetchRegister(user, email, password, password2, registerForm) {
	registerUser(user, email, password, password2);
	// registerForm.elements.username.value = "";
	// registerForm.elements.email.value = "";
	registerForm.elements.password.value = "";
	registerForm.elements.password2.value = "";
}

// function handleSignUp(e) {
//     e.preventDefault();
//     const registerForm = document.querySelector('#userRegisterForm');
//     const user = registerForm.elements.username.value.toLowerCase().trim();
// 	console.log('username: ', user);
//     const email = registerForm.elements.email.value;
//     const password = registerForm.elements.password.value;
//     const password2 = registerForm.elements.password2.value;
//     if (user && email && password && password2) {
//         fetchRegister(user, email, password, password2, registerForm);
//     } else {
//         insertInputValidation(registerForm);
//     }
// }


function handleSignUp(e) {
    e.preventDefault();
	try {
		const registerForm = document.querySelector('#userRegisterForm');
		const user = registerForm.elements.username.value.toLowerCase().trim();
		console.log('username: ', user);
		const validNamePattern = /^[a-zA-Z0-9]+$/;
		if (!validNamePattern.test(user)) {
			const errorObject = {
				message: "Invalid input: Name must be 1-8 characters long and contain only letters or numbers.",
				status: 400,
			}
			throw errorObject;
		}
		const email = registerForm.elements.email.value;
		const password = registerForm.elements.password.value;
		const password2 = registerForm.elements.password2.value;
		if (user && email && password && password2) {
			fetchRegister(user, email, password, password2, registerForm);
		} else {
			insertInputValidation(registerForm);
		}
	} catch (e) {
		displayError(e.message);
	}
}


async function registerUser(user, email, password, password2) {
	const userInfo = {
		username: user,
		email: email,
		password: password,
		confirm_password: password2,
	};
	const sendUserInfo = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(userInfo),
	};
	try {

		const response = await fetch(`${baseURL}/user/register/`, sendUserInfo);
		let message

		if (!response.ok) {

			if(response.status === 400 || response.status === 422) {
				const errorData = await response.json(); // msn que vem do Django (serializer)
				console.log('errorData: ', errorData);
				message = Object.values(errorData)[0];
				const input = Object.keys(errorData)[0];// só para controlo na consola
				console.log('message: ', message);
				// console.log('input: ', input);
			} else {
				message = response.statusText
			}
			
			const errorObject = {
				message: message,
				status: response.status
			}
			// console.log(errorObject.message, errorObject.status, errorObject.status_msn);
			throw errorObject;
		}

		const data = await response.json();
		console.log('data register: ', data);
		// { detail: "Registration data received. Please check your email for the confirmation code." } - exemplo do erro

		if (data) {
			displayEmailCode(data.detail);
		} else {
			throw { message: 'Something went wrong - emailCode', status: 401 };
		}

		const buttonEmailCode = document.querySelector('#verifyEmailCode');
		buttonEmailCode.addEventListener('click', (e) => {
			e.preventDefault();
			submitEmailCode(email);
		});

	} catch (e) {

		// o status 422 acontece quando é colocado um email que não exist, em consequência o email do code não é enviado
		if (e.status === 400 || e.status === 422) {
			const err_key = Object.keys(e.message)[0];
			const err_message = e.message[err_key];
			displayError(err_message);
		}
		else {
			navigateTo(`/error/${e.status}/${e.message}`);
		}

	}
};

export { handleSignUp, insertInputValidation }