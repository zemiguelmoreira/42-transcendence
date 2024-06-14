

function saveToken(token, user) {

	if (token !== null && token !== undefined && token.trim!=="")
	try {
		localStorage.setItem('token', token);
		localStorage.setItem('user', user);
		console.log('Token salvo com sucesso na localStorage.');
	} catch (error) {
		console.error('Erro ao salvar o token na localStorage:', error);
	}
}

function viewToken() {
	const token = localStorage.getItem('token');
	// console.log(token);
	return token !== null && token !== undefined && token.trim() !== '';
}



function removeToken() {
	try {
		const token = localStorage.getItem('token');
		localStorage.removeItem('token');
		console.log(`Item com chave "${token}" removido com sucesso da localStorage.`);
	} catch (error) {
		console.error(`Erro ao remover o item com chave "${token}" da localStorage:`, error);
	}
}

// também podemos utilizar o eveto unload

function removeToken2() {

	window.addEventListener('beforeunload', function(event) {
	// Remover o token da localStorage
	localStorage.removeItem('token');
  })
}



export { saveToken, viewToken, removeToken, removeToken2 }
