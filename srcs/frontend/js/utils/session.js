
function saveToken(access_token, refresh_token) {
    if (access_token && access_token.trim() !== "" && refresh_token && refresh_token.trim() !== "") {
        try {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            console.log('Tokens salvo com sucesso na localStorage.');
        } catch (error) {
            console.error('Erro ao salvar os tokens na localStorage:', error);
        }
    } else {
        console.error('Os tokens não podem ser nulos, indefinidos ou strings vazias.');
    }
}

function viewToken() {
	const token = localStorage.getItem('access_token');
	// console.log(token);
	return token !== null && token !== undefined && token.trim() !== '';
}

function viewTokenRefresh() {
	const refreshToken = localStorage.getItem('refresh_token');
	// console.log(token);
	return refreshToken !== null && refreshToken !== undefined && refreshToken.trim() !== '';
}



function removeToken() {
	try {
		const token = localStorage.getItem('access_token');
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		console.log(`Item com chave "${token}" removido com sucesso da localStorage.`);
	} catch (error) {
		console.error(`Erro ao remover o item com chave "${token}" da localStorage:`, error);
	}
}

// também podemos utilizar o eveto unload

function removeToken2() {

	window.addEventListener('beforeunload', function(event) {
	// Remover o token da localStorage
	localStorage.removeItem('access_token');
	localStorage.removeItem('refresh_token');
  })
}



export { saveToken, viewToken, viewTokenRefresh, removeToken, removeToken2 }
