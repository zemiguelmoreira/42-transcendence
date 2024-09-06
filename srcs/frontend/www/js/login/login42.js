
import { baseURL } from "../app.js";
import { displayError } from "../utils/utils1.js";
import { saveToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { home } from "../home/home.js";

const clientId = 'u-s4t2ud-159130180b55795d9366f64e165fe220ae4cb2c8b5e412a3424d938148c1f337';

// const uri = encodeURIComponent('http://127.0.0.1:5500/42/Transcendence/index.html');
const uri = encodeURIComponent('https://localhost/');

const scope = encodeURIComponent('public');

const state = 'csrf_protect';

// const urlAuth = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&response_type=code&scope=${scope}&state=${state}`;


// console.log("Início do script");
// console.log(urlAuth);
// const button = document.querySelector("#teste");
// console.log(button);
// console.log("Fim do script");

// button.addEventListener('click', getCode);

function userSignIn42(e) {

	e.preventDefault();

    const urlAuth = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&response_type=code&scope=${scope}&state=${state}`;
    
    // window.location.href = "";
    console.log('href-app.js no login 42: ', window.location.href);
	window.location.href = urlAuth;
    console.log('href-app.js no login 42: ', window.location.href);
    // getParams();

}


// function userSignIn42(e) {
// 	e.preventDefault();
//     const urlAuth = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&response_type=code&scope=${scope}&state=${state}`;
//     
//     // window.location.href = "";
//     const popup = window.open(urlAuth, 'authPopup', 'width=600,height=600');
            
//     // Verifica se o popup foi bloqueado
//     if (!popup) {
//         alert('Por favor, permita popups para este site.');
//         return;
//     }

// }

// esta função tem de ser chamada na app.js
async function getParams() {

	console.log(window.location.search);

	const params = new URLSearchParams(window.location.search);

	// Obtém o valor de um parâmetro específico
	let code = params.get('code');
    let state = params.get('state');

    params.delete('code');
    params.delete('state');
	// Verifica se o parâmetro 'code' foi encontrado na query string
	if (code) {
	 	console.log('Código de acesso: ', code);
        console.log('state: ', state);

        const info =  {
            code: code,
            state: state,
            clientId: clientId
        }

        const conf = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(info),
        };

        try {
            const response = await fetch(`${baseURL}/user/signIn42/`, conf);

            if (!response.ok) {
                const errorData = await response.json();
                console.log('errorData login: ', errorData);
                // localStorage.removeItem('access_token');
                // localStorage.removeItem('refresh_token');
                // sessionStorage.clear();
                // clearCookies();
                const errorObject = {
                    message: errorData.detail,
                    status: response.status,
                };
                // console.log(errorObject.message, errorObject.status);
                // signIn();

                throw errorObject;
            }

            const data = await response.json();
            console.log('data após login 42: ', data);

            saveToken(data.access, data.refresh);
            navigateTo(`/user/${data.user.username}`);

            
        } catch (e) {

            if (e.status === 400) {
                // signIn();
                displayError(e.message);
                // navigateTo(`/error/${e.status}/${e.message}`);
                console.log('error data: ', e);
            } else {
                navigateTo('/'); // dá o erro de login na consola no entanto, como o token está válido entra no site
                // home();
                // displayError(e.message);
            }
        }

    }

}

// getParams();

// console.log("Fim do script 1");

export { userSignIn42, getParams }