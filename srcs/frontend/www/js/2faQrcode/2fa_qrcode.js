import { baseURL } from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";
import { saveToken } from "../utils/tokens.js";
import { handleInput, handleInputBlur } from "../utils/utils1.js";

async function fetchQrCode() {
    try {
        const conf = {
            method: 'GET',
            headers: {}
        }
        const response = await fetchWithAuth(`${baseURL}/profile/get_qr_code/`, conf);
        
        if (!response.ok) {
            throw {
                message: response.statusText,
                status: response.status,
            };
        }
        
        const data = await response.json();
        return data.svg;
    } catch (error) {
        return "";
    }
}

function displayQrCode(qr_code) {
    document.getElementById('userSignInForm').style.display = "none";
    const qrCodeDiv = document.getElementById('qr-code');
    qrCodeDiv.innerHTML = "";
    qrCodeDiv.innerHTML = qr_code;
    document.getElementById('qrCodeForm').style.display = 'block'; 
    document.getElementById('code').focus();
    
    const inputField = document.querySelector('#code');
    const limitChar = document.querySelector('#limitChar3');
    handleInput(inputField, limitChar);
    handleInputBlur(inputField, limitChar);
}

function displayErrorCode(errorMessage) {
    const errorDiv = document.getElementById('error-message-code');
    errorDiv.innerHTML = "";
    errorDiv.textContent = `${errorMessage}Try again`;
    errorDiv.style.display = 'block';
    
    const qrForm = document.querySelector('#qrCodeForm');
    qrForm.elements.code.value = "";
    document.getElementById('code').focus();

    for (let element of qrForm.elements) {
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
        let errorObject;
        if (response.status === 400) {
            const errorData = await response.json();
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
        return errorObject;
    } else {
        const data = await response.json();
        saveToken(data.access, data.refresh);
        return data;
    }
}

export { fetchQrCode, displayQrCode, verifyCode, displayErrorCode }
