import { baseURL, navigateTo } from "../app.js";
import { testToken } from "./tokens.js";

async function fetchWithAuth(url, options = {}) {
    let accessToken = localStorage.getItem('access_token');
    if(!accessToken) {
        accessToken = sessionStorage.getItem('access_token');
    }
	testToken(accessToken);
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };
    let response = await fetch(url, options);
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            let new_accessToken = localStorage.getItem('access_token');
            if(!new_accessToken) {
                new_accessToken = sessionStorage.getItem('access_token');
            }
            options.headers['Authorization'] = `Bearer ${new_accessToken}`;
            testToken(new_accessToken);
            response = await fetch(url, options);
        }
    }
    return response;
}

async function refreshAccessToken() {
	const refreshToken = localStorage.getItem('refresh_token');
    try {
		const url = `${baseURL}/token/refresh/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refreshToken,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            if (window.location.pathname && window.location.pathname === "/signIn") {
                sessionStorage.setItem('access_token', data.access);
            } else {
			    localStorage.setItem('access_token', data.access);
            }
			return true;
        } else {
            const errorData = await response.json();
			return false;
        }
    } catch (error) {
		return false;
    }
}

export { fetchWithAuth, refreshAccessToken }