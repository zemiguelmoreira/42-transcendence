import { baseURL } from "../app.js";
import { displayError } from "../utils/utils1.js";
import { viewToken, saveToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { successContainer } from "../utils/utils1.js";
// import WebSocketInstance from "../socket/websocket.js";

const clientId = 'u-s4t2ud-159130180b55795d9366f64e165fe220ae4cb2c8b5e412a3424d938148c1f337';
const uri = encodeURIComponent(`https://${window.location.host}/callback`);
const scope = encodeURIComponent('public');
const state = 'csrf_protect';

function userSignIn42(e) {
    const urlAuth = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&response_type=code&scope=${scope}&state=${state}`;
    window.open(urlAuth, '_blank', 'width=900,height=900');
}

async function getParams(code) {
	if (code) {
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
            console.log('response na api42: ', response);
            let errorObject;
            if (!response.ok) {
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
                throw errorObject;
            }
            const data = await response.json();
            console.log('data na api42: ', data);
            saveToken(data.access, data.refresh);
            if (viewToken()) {
                document.getElementById('root').innerHTML = "";
                const successDiv = successContainer(data.user.username);
                document.getElementById('root').insertAdjacentHTML('afterbegin', successDiv);
                let messageDiv = document.getElementById('successMessage');
                messageDiv.style.display = 'block'; // Exibe a mensagem
                setTimeout(async function () {
                    messageDiv.style.display = 'none';
                    // await WebSocketInstance.connect();
                    navigateTo(`/user/${data.user.username}`);
                }, 1000);
            } else {
                throw { message: `User ${data.user.username} not validated - bad request`, status: 401 };
            }
            // navigateTo(`/user/${data.user.username}`);
        } catch (e) {
            if (e.status === 400) {
                displayError(e.message);
            } else {
                // navigateTo('/');
                navigateTo(`/error/${e.status}/${e.message}`);
                localStorage.removeItem('access_token');
                sessionStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        }
    }
}

export { userSignIn42, getParams }
