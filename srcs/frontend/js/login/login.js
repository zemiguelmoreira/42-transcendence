import { limparDivAll } from "../utils/utils1.js";
import { baseURL } from "../app.js";
import { signIn_page } from "./loginPage.js";
import { getCsrfToken } from "../utils/tokenCsrf.js";
import { displayErrorSignIn, successContainer } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { saveToken, viewToken, testToken } from "../utils/tokens.js";
import { getNamebyId } from "../profile/myprofile.js";


function insertInputValidation1(userSigInForm) {
	for (let element of userSigInForm.elements) {
		console.log(element);

		// Verifica se o elemento é do tipo input e tem a classe 'form-control'
		if (element.className === 'form-control' && !element.value) {
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
	// const allURL = `${baseURL}/profile/login/`;
	const userOrEmail1 = userSignInForm.elements.username.value;
	const password1 = userSignInForm.elements.password.value;
	console.log(userOrEmail1, password1);
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
	setTimeout(function() {
		messageDiv.style.display = 'none';
		// console.log(userNameReg);
		navigateTo(`/user/${username}`);
	}, 1000); // 1000 milissegundos = 1 segundos
}

function signIn() {
	// e.preventDefault();
	
	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', signIn_page);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	const signInUser = document.querySelector('#signInUser');
	signInUser.addEventListener('click', userSignIn);
	
}


async function sendIUser(userOrEmail, password, allURL) {

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
    //     console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - login',
    //             status: 401,
    //             status_msn: 'CSRF token not found'
    //         };
    //     }
    // } catch (error) {
    //     console.log(error.message, error.status, error.status_msn);
    //     navigateTo(`/error/${error.status}/${error.message}`);
    //     return;
    // }

    const dados = {
        username: userOrEmail,
        password: password
    };

    const configuracao = {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            // 'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(dados),
    };

    try {

        const response = await fetch(`${baseURL}/token/`, configuracao);
        console.log('response login: ', response);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('errorData login: ', errorData.detail);
            const errorObject = {
                message: errorData.detail,
                status: response.status,
                // status_msn: response.statusText
            };
            console.log(errorObject.message, errorObject.status);
            throw errorObject;
        }

        const data = await response.json();
        console.log('data login: ', data);
        // console.log(data.access_token, data.refresh_token);

        saveToken(data.access, data.refresh);
        console.log('localstorage', viewToken());
        const payload = testToken(data.access);
		console.log(payload);
        let username = await getNamebyId(payload.user_id);
		console.log(username);

        limparDivAll('root');
        const successDiv = successContainer(username);
        document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
        
        //o if do teste do token não será necessário porque o navigate faz esse teste à rota (manter para teste)
        if (viewToken()) {
            showSuccessMessageSignIn(username);
        } else {
            throw {
                message: 'Something went wrong - sendIUser',
                status: 404,
            };
        }

    } catch (e) {

        // console.log(e.message, e.status, e.status_msn);
        if (e.status === 401) {
            displayErrorSignIn(e.message);
        } else {
            navigateTo(`/error/${e.status}/${e.message}`);
        }
    }
}



export { signIn, userSignIn }