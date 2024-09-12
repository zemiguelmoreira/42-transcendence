import { baseURL } from "../app.js";
import { displayError } from "../utils/utils1.js";
import { saveToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";

const clientId = 'u-s4t2ud-159130180b55795d9366f64e165fe220ae4cb2c8b5e412a3424d938148c1f337';
const uri = encodeURIComponent('https://localhost/callback');
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
        try {zz
            const response = await fetch(`${baseURL}/user/signIn42/`, conf);
            if (!response.ok) {
                const errorData = await response.json();
                const errorObject = {
                    message: errorData.detail,
                    status: response.status,
                };
                throw errorObject;
            }
            const data = await response.json();
            saveToken(data.access, data.refresh);
            navigateTo(`/user/${data.user.username}`);
        } catch (e) {
            if (e.status === 400) {
                displayError(e.message);
            } else {
                navigateTo('/');
            }
        }
    }
}

export { userSignIn42, getParams }