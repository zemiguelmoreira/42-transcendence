
import { baseURL } from "../app.js";
import { displayError } from "../utils/utils1.js";
import { saveToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { home } from "../home/home.js";

const clientId = 'u-s4t2ud-159130180b55795d9366f64e165fe220ae4cb2c8b5e412a3424d938148c1f337';

// const uri = encodeURIComponent('http://127.0.0.1:5500/42/Transcendence/index.html');
const uri = encodeURIComponent('https://localhost/callback');

const scope = encodeURIComponent('public');

const state = 'csrf_protect';

function userSignIn42(e) {

	// e.preventDefault();

    const urlAuth = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&response_type=code&scope=${scope}&state=${state}`;
    
    console.log('href-app.js no login 42: ', window.location.href);
	
    console.log('href-app.js no login 42: ', window.location.href);

    window.open(urlAuth, '_blank', 'width=900,height=900');

}



// esta função tem de ser chamada na app.js
async function getParams(code) {

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
                // navigateTo('/');
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

export { userSignIn42, getParams }