import { baseURL } from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";
import { saveToken } from "../utils/tokens.js";
import { handleInput, handleInputBlur } from "../utils/utils1.js";

// Fetches the QR code from the server using authentication
async function fetchQrCode() {
    try {
        const conf = {
            method: 'GET',
            headers: {}
        }
        const response = await fetchWithAuth(`${baseURL}/profile/get_qr_code/`, conf);
        
        // If the response is not successful, throw an error
        if (!response.ok) {
            throw {
                message: response.statusText,
                status: response.status,
            };
        }
        
        // Return the SVG QR code data
        const data = await response.json();
        return data.svg;
    } catch (error) {
        // Log any errors encountered during the request
        return "";
    }
}

// Displays the fetched QR code on the page and hides the sign-in form
function displayQrCode(qr_code) {
    document.getElementById('userSignInForm').style.display = "none";
    const qrCodeDiv = document.getElementById('qr-code');
    qrCodeDiv.innerHTML = ""; // Clear previous content if any
    qrCodeDiv.innerHTML = qr_code; // Insert the QR code SVG
    document.getElementById('qrCodeForm').style.display = 'block'; // Show QR code form
    document.getElementById('code').focus(); // Focus on the input field
    
    // Attach event handlers to the input field
    const inputField = document.querySelector('#code');
    const limitChar = document.querySelector('#limitChar3');
    handleInput(inputField, limitChar);
    handleInputBlur(inputField, limitChar);
}

// Displays error message related to QR code verification
function displayErrorCode(errorMessage) {
    const errorDiv = document.getElementById('error-message-code');
    errorDiv.innerHTML = ""; // Clear any existing error messages
    errorDiv.textContent = `${errorMessage}Try again`; // Set the new error message
    errorDiv.style.display = 'block'; // Make the error message visible
    
    // Clear input field and refocus on it
    const qrForm = document.querySelector('#qrCodeForm');
    qrForm.elements.code.value = "";
    document.getElementById('code').focus();

    // Hide error message when the user starts typing again
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

// Verifies the 2FA code with the server
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
    
    // Make the POST request to verify the 2FA code
    const response = await fetchWithAuth(`${baseURL}/token/verify-2fa/`, conf);

    // Handle potential errors based on response status
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
        return errorObject; // Return the error object
    } else {
        // Save access and refresh tokens if verification is successful
        const data = await response.json();
        saveToken(data.access, data.refresh);
        return data;
    }
}

export { fetchQrCode, displayQrCode, verifyCode, displayErrorCode }
