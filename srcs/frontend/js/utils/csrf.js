
async function getCsrfToken() {
	const response = await fetch(`/user/get-csrf-token/`, {
		method: 'GET',
		credentials: 'include',
	});

	if (!response.ok) {
		throw new Error('Failed to get CSRF token');
	}

	const data = await response.json();
	console.log('crsfToken: ', data.csrfToken);
	return data.csrfToken;
}

function getCsrfTokenFromCookies() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

export { getCsrfToken, getCsrfTokenFromCookies }