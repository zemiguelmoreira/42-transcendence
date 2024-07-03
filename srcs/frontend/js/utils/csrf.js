
async function getCsrfToken() {
	const response = await fetch(`https://localhost/user/get-csrf-token/`, {
		method: 'GET',
		credentials: 'include',
	});

	if (!response.ok) {
		throw new Error('Failed to get CSRF token');
	}

	const data = await response.json();
	// console.log('crsfToken: ', data.csrfToken);
	return data.csrfToken;
}


export { getCsrfToken }