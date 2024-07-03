import { getCsrfToken } from "./utils/csrf.js";
import { saveToken } from "./utils/session.js";

function handleSignIn(event) {
    event.preventDefault();  // Mover event.preventDefault() para dentro de handleSignIn
    const signInForm = document.querySelector('#userSignInForm');
    const userOrEmail = signInForm.elements.username.value;
    const password = signInForm.elements.password.value;
    if (userOrEmail && password) {
        sendIUser(userOrEmail, password);
        signInForm.elements.username.value = "";
        signInForm.elements.password.value = "";
    }
}

async function sendIUser(userOrEmail, password) {
    const csrfToken = await getCsrfToken();
    console.log(csrfToken);
    const dados = {
        username: userOrEmail,
        password: password
    };
    console.log(dados);
    const configuracao = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(dados),
    };

    try {
        const response = await fetch('/user/profile/login/', configuracao);
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                const errorObject = {
                    message: errorData.error,
                    status: response.status,
                    status_msn: response.statusText
                }
                console.log(errorObject.message, errorObject.status, errorObject.status_msn);
                throw errorObject;
            } else {
                const errorText = await response.text();
                console.error('Unexpected response:', errorText);
                throw new Error('Unexpected response from server');
            }
        }

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(data);
            saveToken(data.access_token, data.user.username);
            window.loadPage('home', false);
        } else {
            const errorText = await response.text();
            console.error('Unexpected response:', errorText);
            throw new Error('Unexpected response from server');
        }
    } catch (e) {
        console.log(e.message, e.status, e.status_msn);
        if (e.status === 400) {
            console.log('error');
        }
    }
};

function initializeLogin() {
    console.log('login.js loaded');
    const loginForm = document.getElementById('userSignInForm');

    if (!loginForm) {
        console.error('Form not found');
        return;
    }

    loginForm.addEventListener('submit', (event) => {
        handleSignIn(event);  // Passar o evento para handleSignIn
    });

    const signInWith42Btn = document.getElementById('signInUser42');
    signInWith42Btn.addEventListener('click', () => {
        alert('Login with 42!');
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
    console.log('aqui');
    initializeLogin();
}

export { initializeLogin };
