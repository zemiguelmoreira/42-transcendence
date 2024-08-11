
import { baseURL } from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";
import { saveToken } from "../utils/tokens.js";

// Faz o fetch para obter o qr code
async function fetchQrCode() {
    try {

		const conf = {
            method: 'GET',
            headers: {}
        }

        const response = await fetchWithAuth(`${baseURL}/profile/get_qr_code/`, conf);
        if (!response.ok) {
            throw new Error(`Error fetching protected data: ${response.statusText}`);
        }

        const data = await response.json();
        // console.log("SVG no fetchQRCode", data.svg);
        return data.svg;

    } catch (error) {

        console.error(error.message);
        return "";

    }
}


// Mostra o qrcode após fetch. É utilizado o div que faz os erros para mostrar o qr code
function displayQrCode(qr_code) {
    document.getElementById('userSignInForm').style.display = "none";
	const qrCodeDiv = document.getElementById('qr-code');
    qrCodeDiv.innerHTML = "";
	qrCodeDiv.innerHTML = qr_code;
	document.getElementById('qrCodeForm').style.display = 'block';
    document.getElementById('code').focus(); // colocar focus no campo de colocação do código
}


function displayErrorCode(errorMessage) {
	const errorDiv = document.getElementById('error-message-code');
	errorDiv.innerHTML = "";
	errorDiv.textContent = `${errorMessage}Try again`;
	errorDiv.style.display = 'block'; // Mostra a div de erro
	const registerForm = document.querySelector('#userSignInForm');
	// console.log(registerForm);
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


async function verifyCode(userOrEmail, qrCode) {
    
    // console.log('qrCode no verify: ', qrCode);

    const data = {
        username: userOrEmail,
        code: qrCode,
    };

    const conf = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };

    const response = await fetchWithAuth(`${baseURL}/token/verify-2fa/`, conf);

    if (!response.ok) {
        
        const errorData = await response.json();
        // console.log('errorData login: ', errorData.detail);
        const errorObject = {
            message: errorData.detail,
            status: response.status,
            // status_msn: response.statusText
        };
        // console.log(errorObject.message, errorObject.status);
        return errorObject;

    } else {

        const data = await response.json();

        // console.log('data login no verifycode: ', data);
        saveToken(data.access, data.refresh);
        
        // console.log("2FA verified successfully.");
        return data;  
    }
}



export { fetchQrCode, displayQrCode, verifyCode, displayErrorCode }