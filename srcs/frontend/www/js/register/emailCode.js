
import { baseURL } from "../app.js";
import { insertInputValidation } from "./register.js";
import { navigateTo, goTo } from "../app.js";
import { successContainerRegister } from "../utils/utils1.js";
import { handleInput, handleInputBlur } from "../utils/utils1.js";

function displayEmailCode(text) {
    document.getElementById('userRegisterForm').style.display = "none";
	const emailCodeText = document.getElementById('email-code');
    emailCodeText.innerHTML = "";
	emailCodeText.textContent = `${text}`;
	document.getElementById('emailCodeForm').style.display = 'block';
    document.getElementById('emailCode').focus(); // colocar focus no campo de colocação do código
    const inputField = document.querySelector('#emailCode');
	const limitChar = document.querySelector('#limitChar1');
	handleInput(inputField, limitChar);
	handleInputBlur(inputField, limitChar);
}

function displayErrorEmailCode(errorMessage) {
	const errorText = document.getElementById('error-message-emailCode');
	errorText.innerHTML = "";
	errorText.textContent = `${errorMessage}Try again`;
	errorText.style.display = 'block';
    const emailCodeForm = document.querySelector('#emailCodeForm');
    emailCodeForm.elements.code.value = "";
    document.getElementById('emailCode').focus();
	for (let element of emailCodeForm.elements) {
		if (element.classList.contains('form-control')) {
			element.addEventListener('input', function () {
				if (element.value) {
					errorText.style.display = 'none';
				}
			});
		}
	}
}


function showSuccessMessageRegister() {
	var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block';
	setTimeout(function() {
		messageDiv.style.display = 'none';
		if (!localStorage.getItem('access_token')) {
			navigateTo(`/signIn`);
		} else {
			goTo();
		}
	}, 2000);
}

async function submitEmailCode(email) {
	const emailCodeForm = document.querySelector('#emailCodeForm');
	const code = emailCodeForm.elements.code.value;
	if (code) {
		try {
			const result = await verifyEmailCode(email, code);
			if (result.status && result.status === 400)
				throw { message: 'Invalid or expired code', status: 400 };
			emailCodeForm.elements.code.value = "";
			document.getElementById('emailCodeForm').style.display = 'none';
			document.getElementById('userRegisterForm').style.display = "block";
			document.getElementById('root').innerHTML = "";
			const successDiv = successContainerRegister(result.username); //tem de devolver o user no result
			document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
			showSuccessMessageRegister();
		} catch (e) {
			if (e.status === 400) {
				displayErrorEmailCode(e.message);
			} else {
				navigateTo(`/error/${e.status}/${e.message}`);
			}
		}
	} else {
		insertInputValidation(emailCodeForm);
	}
}

async function verifyEmailCode(email, emailCode) {
    const data = {
        email: email,
        code: emailCode,
    };
    const conf = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };
    const response = await fetch(`${baseURL}/user/confirm_register/`, conf);
    if (!response.ok) {
        const errorData = await response.json();
        const errorObject = {
            message: errorData.detail,
            status: response.status,
        };
        return errorObject;
    } else {
        const data = await response.json();
        return data;  
    }
}

export { displayEmailCode, displayErrorEmailCode, submitEmailCode, verifyEmailCode }