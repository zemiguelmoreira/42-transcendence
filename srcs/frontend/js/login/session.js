

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


//Alternativa guardar em cookies

function saveTokenCookie(token, user) {
    if (token && user) {
        try {
            // Configurações do cookie
            const cookieSettings = {
                // Define o nome do cookie
                name: 'session_cookie',
                // Define o valor do cookie (token e user podem ser concatenados ou serializados)
                value: JSON.stringify({ token, user }),
                // Define a expiração do cookie (em dias, 1 para uma sessão)
                expires: 1,
                // Define o caminho do cookie (opcional, padrão é '/')
                path: '/',
                // Define a flag HttpOnly para segurança (impede acesso via JavaScript)
                // httpOnly: true,
                // Define a flag Secure para segurança (apenas HTTPS)
                secure: true
            };

            // Monta a string do cookie
            let cookieString = `${cookieSettings.name}=${encodeURIComponent(cookieSettings.value)}`;
            if (cookieSettings.expires) {
                const expires = new Date(Date.now() + cookieSettings.expires * 24 * 60 * 60 * 1000);
                cookieString += `; expires=${expires.toUTCString()}`;
            }
            if (cookieSettings.path) {
                cookieString += `; path=${cookieSettings.path}`;
            }
            if (cookieSettings.httpOnly) {
                cookieString += `; HttpOnly`;
            }
            if (cookieSettings.secure) {
                cookieString += `; Secure`;
            }

            // Define o cookie no documento
            document.cookie = cookieString;
			console.log(cookieString);

            console.log('Token salvo com sucesso no cookie.');
        } catch (error) {
            console.error('Erro ao salvar o token no cookie:', error);
        }
    } else {
        console.error('Token ou usuário inválido.');
    }
}

// #não funciona por causa do headers httpOnly que não permite aceder a ela com javascript

function viewTokenCookie() {
    // Obtém todos os cookies do navegador
	// console.log('viewcokies1: ', document.cookie);
	// console.log('viewcokies: ', document.cookie.split(';'));

    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    
    // Procura pelo cookie que contém o token
    const tokenCookie = cookies.find(cookie => cookie.startsWith('session_cookie='));
	console.log('tokenCookie: ', tokenCookie);
    if (tokenCookie) {
        // Obtém o valor do cookie e decodifica
        const cookieValue = decodeURIComponent(tokenCookie.split('=')[1]);

        // Parseia o valor do cookie para obter o token e o usuário
        const { token, user } = JSON.parse(cookieValue);

        console.log('Token:', token);
        console.log('User:', user);

        // Verifica se o token não está vazio ou indefinido
        return token && token.trim() !== '';
    } else {
        console.log('Token não encontrado no cookie.');
        return false;
    }
}


function removeTokenCookie() {
    try {
        // Configurações do cookie para remoção
        const cookieSettings = {
            name: 'session_cookie',
            expires: -1, // Define a expiração do cookie no passado para removê-lo
            path: '/',
            httpOnly: true,
            secure: true
        };

        // Monta a string do cookie para remoção
        let cookieString = `${cookieSettings.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
        if (cookieSettings.path) {
            cookieString += `; path=${cookieSettings.path}`;
        }
        if (cookieSettings.httpOnly) {
            cookieString += `; HttpOnly`;
        }
        if (cookieSettings.secure) {
            cookieString += `; Secure`;
        }

        // Define o cookie no documento para removê-lo
        document.cookie = cookieString;

        console.log('Token removido com sucesso do cookie.');
    } catch (error) {
        console.error('Erro ao remover o token do cookie:', error);
    }
}


export { saveToken, viewToken, removeToken, removeToken2, saveTokenCookie, viewTokenCookie, removeTokenCookie }


