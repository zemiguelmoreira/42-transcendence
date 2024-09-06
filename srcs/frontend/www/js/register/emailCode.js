
import { baseURL } from "../app.js";
import { insertInputValidation } from "./register.js";
import { navigateTo, goTo } from "../app.js";
import { successContainerRegister } from "../utils/utils1.js";
import { handleInput, handleInputBlur } from "../utils/utils1.js";


function displayEmailCode(text) {
    document.getElementById('userRegisterForm').style.display = "none";
	const emailCodeText = document.getElementById('email-code');
    console.log('elemento para colocar texto: ', emailCodeText);
    emailCodeText.innerHTML = "";
	emailCodeText.textContent = `${text}`;
	document.getElementById('emailCodeForm').style.display = 'block';
    document.getElementById('emailCode').focus(); // colocar focus no campo de colocação do código

    const inputField = document.querySelector('#emailCode');
	const limitChar = document.querySelector('#limitChar1');
	handleInput(inputField, limitChar);
	handleInputBlur(inputField, limitChar);

    console.log('teste1'); // só para teste
}



function displayErrorEmailCode(errorMessage) {
	const errorText = document.getElementById('error-message-emailCode');
	errorText.innerHTML = "";
	errorText.textContent = `${errorMessage}Try again`;
	errorText.style.display = 'block'; // Mostra a div de erro
    const emailCodeForm = document.querySelector('#emailCodeForm');
    emailCodeForm.elements.code.value = "";
    document.getElementById('emailCode').focus();// coloca o focus no input do código
	// console.log(registerForm);
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


//tem a alteração para não entrar no sigIn se tiver token (pode acontecer no histórico)
function showSuccessMessageRegister() {
	var messageDiv = document.getElementById('successMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	setTimeout(function() {
		messageDiv.style.display = 'none';
		// console.log('função ternária');
		// localStorage.getItem('access_token') ? goTo() : navigateTo(`/signIn`);
		if (!localStorage.getItem('access_token')) {
			navigateTo(`/signIn`);
		} else {
			goTo();
			console.log('Current URL:', window.location.href);
		}
	}, 2000); // 1000 milissegundos = 1 segundos
}


async function submitEmailCode(email) {

	const emailCodeForm = document.querySelector('#emailCodeForm');
	const code = emailCodeForm.elements.code.value;
	// console.log('teste o code é: ', code);
	if (code) {
		try {
			const result = await verifyEmailCode(email, code); // após verificação colocar os campos do qrCodeForm a zero
			// console.log('result status: ', result.status); // se não validar o result será um erro
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
    
    // console.log('qrCode no verify: ', qrCode);

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
        console.log('errorData register: ', errorData);
        const errorObject = {
            message: errorData.detail,
            status: response.status,
        };
        // console.log(errorObject.message, errorObject.status);
        return errorObject;

    } else {

        const data = await response.json();

        console.log('data login no verifycode: ', data);
        // saveToken(data.access, data.refresh);
        
        // console.log("2FA verified successfully.");
        return data;  
    }
}



export { displayEmailCode, displayErrorEmailCode, submitEmailCode, verifyEmailCode }