
async function registerUser() {
	const username = document.getElementById('register-username').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	console.log(username, email, password);

	try {
		const response = await fetch('/api/user/register/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username,
				email: email,
				password: password,
			}),
		});

		if (response.ok) {
			// resposta.innerHTML = "User registered successfully!";
			alert('User registered successfully!');
		} else {
			const data = await response.json();
			throw new Error(data.detail || 'Registration failed');
		}
	} catch (error) {
		// console.error('Error during registration:', error.message);
		alert('Registration failed. Please check your inputs and try again.');
	}
}

let accessToken = '';  // Token JWT para uso posterior

async function loginUser() {
	const username = document.getElementById('login-username').value;
	const password = document.getElementById('login-password').value;

	try {
		const response = await fetch('/api/token/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username,
				password: password,
			}),
		});

		if (response.ok) {
			const data = await response.json();
			accessToken = data.access;  // Salve o token de acesso
			console.log("Access token: " + accessToken);
			document.getElementById('login-form').style.display = 'none';
			document.getElementById('verifyForm').style.display = 'block';
			await fetchQRCode();
		} else {
			const errorText = await response.text();
			try {
				const data = JSON.parse(errorText);
				throw new Error(data.detail || 'Login failed');
			} catch (e) {
				throw new Error('Login failed: ' + errorText);
			}
		}
	} catch (error) {
		console.error('Error during login:', error.message);
		document.getElementById('message').textContent = 'Login failed. Please check your username and password.';
	}
}

async function fetchQRCode() {
	try {
		const response = await fetch('/api/profile/get_qr_code/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			console.log(data.svg);
			document.getElementById('qrcode').innerHTML = data.svg;

			// const svgElement = qrcodeDiv.querySelector('svg');
			// if (svgElement) {
			//     svgElement.setAttribute('width', '200');
			//     svgElement.setAttribute('height', '200');
			// }
		} else {
			throw new Error('Failed to fetch QR code.');
		}
	} catch (error) {
		console.error('Error during fetching QR code:', error.message);
		document.getElementById('verifyMessage').textContent = 'Failed to fetch QR code.';
	}
}

async function verifyCode() {
	const username = document.getElementById('loginUsername').value;
	const code = document.getElementById('code').value;

	try {
		const response = await fetch('/api/token/verify-2fa/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				username: username,
				code: code,
			}),
		});

		if (response.ok) {
			const data = await response.json();
			console.log("2FA verified successfully.");
			const accessToken = data.access;
			const refreshToken = data.refresh;
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
			document.getElementById('verifyMessage').textContent = '2FA verification successful. You are logged in.';
		} else {
			const errorText = await response.text();
			try {
				const data = JSON.parse(errorText);
				throw new Error(data.detail || 'Invalid or expired 2FA code.');
			} catch (e) {
				throw new Error('Invalid or expired 2FA code: ' + errorText);
			}
		}
	} catch (error) {
		console.error('Error during 2FA verification:', error.message);
		// document.getElementById('verifyMessage').textContent = 'Invalid or expired 2FA code.';
	}
}

// async function verify2faCode() {
//     const username = document.getElementById('loginUsername').value;
//     const code = document.getElementById('twoFactorCode').value;

//     try {
//         const response = await fetch('/api/token/verify-2fa/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 username: username,
//                 code: code,
//             }),
//         });

//         if (response.ok) {
//             const data = await response.json();
//             const accessToken = data.access;
//             const refreshToken = data.refresh;
//             localStorage.setItem('accessToken', accessToken);
//             localStorage.setItem('refreshToken', refreshToken);
//             alert('Login successful!');
//         } else {
//             const data = await response.json();
//             throw new Error(data.detail || '2FA verification failed');
//         }
//     } catch (error) {
//         console.error('Error during 2FA verification:', error.message);
//         document.getElementById('verifyMessage').textContent = '2FA verification failed. Please check your code.';
//     }
// }

function logoutUser() {
	localStorage.removeItem('accessToken');
	localStorage.removeItem('refreshToken');
	alert('Logout successful!');
}

async function refreshAccessToken(refreshToken) {
	try {
		const response = await fetch('/api/token/refresh/', {
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
			const accessToken = data.access;
			localStorage.setItem('accessToken', accessToken);
			alert('Token refreshed successfully!');
			return accessToken;
		} else {
			const data = await response.json();
			throw new Error(data.detail || 'Token refresh failed');
		}
	} catch (error) {
		console.error('Error refreshing token:', error.message);
		return null;
	}
}

window.addEventListener('DOMContentLoaded', async () => {
	const accessToken = localStorage.getItem('accessToken');
	const refreshToken = localStorage.getItem('refreshToken');

	if (accessToken) {
		const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
		const tokenExpiration = new Date(tokenPayload.exp * 1000);
		const currentDateTime = new Date();

		if (tokenExpiration < currentDateTime) {
			const newAccessToken = await refreshAccessToken(refreshToken);
			if (!newAccessToken) {
				alert('Session expired. Please login again.');
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			}
		} else {
			alert('User already logged in!');
		}
	}
});

async function getUserProfile() {
	const accessToken = localStorage.getItem('accessToken');
	try {
		const response = await fetch('/api/profile/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			console.log(data);
			alert('Profile retrieved successfully!');
		} else {
			throw new Error('Failed to fetch profile');
		}
	} catch (error) {
		console.error('Error fetching profile:', error.message);
		alert('Failed to fetch profile. Please try again.');
	}
}

async function listAllUsers() {
	const accessToken = localStorage.getItem('accessToken');
	try {
		const response = await fetch('/api/profile/all_users/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			console.log(data);
			alert('Users listed in console.');
		} else {
			throw new Error('Failed to fetch users');
		}
	} catch (error) {
		console.error('Error fetching users:', error.message);
		alert('Failed to fetch users. Please try again.');
	}
}

async function updateUserProfile() {
	const accessToken = localStorage.getItem('accessToken');
	const bio = document.getElementById('bio').value;
	const alias_name = document.getElementById('alias_name').value;

	try {
		const response = await fetch('/api/profile/bio/', {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				bio: bio,
				alias_name: alias_name,
			}),
		});

		if (response.ok) {
			alert('Profile updated successfully!');
		} else {
			throw new Error('Failed to update profile');
		}
	} catch (error) {
		console.error('Error updating profile:', error.message);
		alert('Failed to update profile. Please try again.');
	}
}

async function addFriend() {
	const accessToken = localStorage.getItem('accessToken');
	const friendUsername = document.getElementById('friendUsername').value;
	try {
		const response = await fetch('/api/profile/add_friend/', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				friend_username: friendUsername,
			}),
		});

		if (response.ok) {
			alert('Friend added successfully!');
		} else {
			throw new Error('Failed to add friend');
		}
	} catch (error) {
		console.error('Error adding friend:', error.message);
		alert('Failed to add friend. Please try again.');
	}
}

async function removeFriend() {
	const accessToken = localStorage.getItem('accessToken');
	const friendUsername = document.getElementById('friendUsername').value;
	try {
		const response = await fetch('/api/profile/remove_friend/', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				friend_username: friendUsername,
			}),
		});

		if (response.ok) {
			alert('Friend removed successfully!');
		} else {
			throw new Error('Failed to remove friend');
		}
	} catch (error) {
		console.error('Error removing friend:', error.message);
		alert('Failed to remove friend. Please try again.');
	}
}

async function blockUser() {
	const accessToken = localStorage.getItem('accessToken');
	const blockedUsername = document.getElementById('blockUsername').value;
	try {
		const response = await fetch('/api/profile/block_user/', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				blocked_username: blockedUsername,
			}),
		});

		if (response.ok) {
			alert('User blocked successfully!');
		} else {
			throw new Error('Failed to block user');
		}
	} catch (error) {
		console.error('Error blocking user:', error.message);
		alert('Failed to block user. Please try again.');
	}
}

async function unblockUser() {
	const accessToken = localStorage.getItem('accessToken');
	const blockedUsername = document.getElementById('blockUsername').value;
	try {
		const response = await fetch('/api/profile/unblock_user/', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				blocked_username: blockedUsername,
			}),
		});

		if (response.ok) {
			alert('User unblocked successfully!');
		} else {
			throw new Error('Failed to unblock user');
		}
	} catch (error) {
		console.error('Error unblocking user:', error.message);
		alert('Failed to unblock user. Please try again.');
	}
}

async function getUserProfileByUsername() {
	const accessToken = localStorage.getItem('accessToken');
	const username = document.getElementById('searchUsername').value;

	try {
		const response = await fetch(`/api/profile/get_user_profile/?username=${username}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});

		if (response.ok) {
			const data = await response.json();
			console.log(data);  // Aqui você pode manipular os dados recebidos conforme necessário
			alert('User profile retrieved successfully!');
		} else {
			const data = await response.json();
			throw new Error(data.detail || 'Failed to retrieve user profile');
		}
	} catch (error) {
		console.error('Error retrieving user profile:', error.message);
		alert('Failed to retrieve user profile. Please try again.');
	}
}

async function deleteUser() {
	const accessToken = localStorage.getItem('accessToken');

	if (!accessToken) {
		alert('You are not logged in!');
		return;
	}

	const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');

	if (!confirmed) {
		return;
	}

	try {
		const response = await fetch('/api/profile/delete-user/', {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (response.status === 204) {
			alert('User deleted successfully');
			localStorage.removeItem('accessToken');  // Remove token from local storage
			localStorage.removeItem('refreshToken'); // Remove refresh token from local storage
			// window.location.href = '/login';  // Redirect to login page
		} else {
			const data = await response.json();
			alert(data.error || 'Failed to delete user');
		}
	} catch (error) {
		console.error('Error deleting user:', error);
		alert('Failed to delete user');
	}
}

async function snakeGameOptions() {
    // Função para adicionar event listeners aos botões
    function addEventListenersToButtons() {
        const buttons = document.querySelectorAll('.snake-button');

        buttons.forEach(button => {
            button.addEventListener('click', async function (event) {
                event.preventDefault();

                // Carregar dinamicamente o CSS
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = './css/snake.css';
                document.head.appendChild(linkElement);

                // Carregar o conteúdo HTML
                try {
                    const response = await fetch('./snake-options.html');
                    if (response.ok) {
                        const content = await response.text();
                        document.getElementById('mainContent').innerHTML = content;

                        // Reatribuir event listeners aos novos botões
                        addEventListenersToButtons();

                        // Inserir dinamicamente o script do jogo
                        const scriptElement = document.createElement('script');

                        document.body.appendChild(scriptElement);
                    } else {
                        console.error('Erro ao carregar o arquivo snake-options.html');
                    }
                } catch (error) {
                    console.error('Erro ao carregar o conteúdo:', error);
                }
            });
        });
    }
    // Adicionar event listeners aos botões na carga inicial da página
    addEventListenersToButtons();
}



// document.addEventListener('DOMContentLoaded', function () {
// 	// Função para adicionar event listeners aos botões
// 	function addEventListenersToButtons() {
// 		const buttons = document.querySelectorAll('.snake-button');

// 		buttons.forEach(button => {
// 			button.addEventListener('click', async function (event) {
// 				event.preventDefault();

// 				// Carregar dinamicamente o CSS
// 				const linkElement = document.createElement('link');
// 				linkElement.rel = 'stylesheet';
// 				linkElement.href = './css/snake.css';
// 				document.head.appendChild(linkElement);

// 				// Carregar o conteúdo HTML
// 				try {
// 					const response = await fetch('./snake.html');
// 					if (response.ok) {
// 						const content = await response.text();
// 						document.getElementById('mainContent').innerHTML = content;

// 						// Reatribuir event listeners aos novos botões
// 						addEventListenersToButtons();

// 						// Encontrar e executar os scripts dentro do conteúdo carregado
// 						const scriptTags = document.getElementById('mainContent').getElementsByTagName('script');
// 						for (const scriptTag of scriptTags) {
// 							const newScript = document.createElement('script');
// 							newScript.text = scriptTag.text;
// 							document.body.appendChild(newScript);
// 						}
// 					} else {
// 						console.error('Erro ao carregar o arquivo snake.html');
// 					}
// 				} catch (error) {
// 					console.error('Erro ao carregar o conteúdo:', error);
// 				}
// 			});
// 		});
// 	}

// 	// Adicionar event listeners aos botões na carga inicial da página
// 	addEventListenersToButtons();
// });

// document.addEventListener('DOMContentLoaded', function () {
// 	// Função para adicionar event listeners aos botões
// 	function addEventListenersToButtons() {
// 		const buttons = document.querySelectorAll('.pong-button');

// 		buttons.forEach(button => {
// 			button.addEventListener('click', async function (event) {
// 				event.preventDefault();

// 				// Carregar dinamicamente o CSS
// 				const linkElement = document.createElement('link');
// 				linkElement.rel = 'stylesheet';
// 				linkElement.href = './css/pong.css';
// 				document.head.appendChild(linkElement);

// 				// Carregar o conteúdo HTML
// 				try {
// 					const response = await fetch('./pong.html');
// 					if (response.ok) {
// 						const content = await response.text();
// 						document.getElementById('mainContent').innerHTML = content;

// 						// Reatribuir event listeners aos novos botões
// 						addEventListenersToButtons();

// 						// Encontrar e executar os scripts dentro do conteúdo carregado
// 						const scriptTags = document.getElementById('mainContent').getElementsByTagName('script');
// 						for (const scriptTag of scriptTags) {
// 							const newScript = document.createElement('script');
// 							newScript.text = scriptTag.text;
// 							document.body.appendChild(newScript);
// 						}
// 					} else {
// 						console.error('Erro ao carregar o arquivo pong.html');
// 					}
// 				} catch (error) {
// 					console.error('Erro ao carregar o conteúdo:', error);
// 				}
// 			});
// 		});
// 	}

// 	// Adicionar event listeners aos botões na carga inicial da página
// 	addEventListenersToButtons();
// });


function showLoginForm() {
	document.getElementById('form-container').innerHTML = `
	<div class="login-title">LOGIN</div>
	<div class="login-middle-box">
		<form class="font-custom button-size" id="login-form">
		<label for="login-username">USERNAME:</label>
		<input class="form-control me-2 button-size" type="text" id="login-username" name="login-username" required>
		<label for="login-password">PASSWORD:</label>
		<input class="form-control me-2 button-size" type="password" id="login-password" name="login-password" required>
		<button id="loginBtn" class="btn btn-outline-success button-size" type="button" onclick="showAuthenticator()">LOGIN</button>
		</form>
	</div>
	<div id="verifyForm" style="display: none;">
		<h2>Scan QR Code</h2>
		<div id="qrcode"></div>
		<h2>Verify 2FA Code</h2>
		<input type="text" id="code" placeholder="Enter 2FA code">
		<button type="button" id="verifyBtn">Verify</button>
		<!-- <button onclick="verifyCode()">Verify</button> -->
		<p id="verifyMessage"></p>
	</div>
	<script>
		document.getElementById('loginBtn').addEventListener('click', loginUser);
	</script>
	`;
}

function showRegisterForm() {
	document.getElementById('form-container').innerHTML = `

	<div class="login-title">REGISTER</div>
	<div class="login-middle-box">
		<form class="font-custom button-size" id="register-form">
			<label for="register-username">USERNAME:</label>
			<input class="form-control me-2 button-size" type="text" id="register-username" name="register-username" required>
			<label for="email">EMAIL:</label>
			<input class="form-control me-2 button-size" type="email" id="email" name="email" required>
			<label for="password">PASSWORD:</label>
			<input class="form-control me-2 button-size" type="password" id="password" name="password" required>
			<button id="registerBtn" class="btn btn-outline-success button-size" type="submit">REGISTER</button>
		</form>
	<script>
		document.getElementById('registerBtn').addEventListener('click', registerUser);
	</script>
	</div>
	`;
}

function showAuthenticator() {
	// Lógica para mostrar o autenticador após o login correto
	document.getElementById('form-container').innerHTML = `
		<h2>Autenticador do Google</h2>
		<p>Insira o código do Google Authenticator aqui.</p>
		<input type="text" id="google-auth-code" name="google-auth-code">
		<button type="button" onclick="verifyAuthenticator()">Verificar</button>
	`;
}

function verifyAuthenticator() {
	// Lógica para verificar o código do Google Authenticator
	alert('Verificação bem-sucedida!');
}

async function homepage() {

	// Carregar o conteúdo HTML
	try {
		const response = await fetch('./homepage.html');
		if (response.ok) {
			const content = await response.text();
			document.getElementById('mainContent').innerHTML = content;

			// Encontrar e executar os scripts dentro do conteúdo carregado
			const scriptTags = document.getElementById('mainContent').getElementsByTagName('script');
			for (const scriptTag of scriptTags) {
				const newScript = document.createElement('script');
				newScript.text = scriptTag.text;
				document.body.appendChild(newScript);
			}
		} else {
			console.error('Erro ao carregar o arquivo homepage.html');
		}
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}
};

async function snakeGame() {
    try {
        const response = await fetch('./snake.html');
        if (response.ok) {
            const content = await response.text();
            document.getElementById('mainContent').innerHTML = content;

            // Carregar dinamicamente o script do jogo
            const scriptElement = document.createElement('script');
            scriptElement.src = './js/snake.js'; // Certifique-se de que o caminho do script está correto
            document.body.appendChild(scriptElement);
        } else {
            console.error('Erro ao carregar o arquivo snake.html');
        }
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}

async function snakeGameOptions() {
    try {
        const response = await fetch('./snake-options.html');
        if (response.ok) {
            const content = await response.text();
            document.getElementById('mainContent').innerHTML = content;
            
            // Carregar dinamicamente o CSS
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = './css/snake.css';
            document.head.appendChild(linkElement);
        } else {
            console.error('Erro ao carregar o arquivo snake-options.html');
        }
    } catch (error) {
        console.error('Erro ao carregar o conteúdo:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Adicionar delegação de eventos ao body para capturar eventos de elementos dinamicamente carregados
    document.body.addEventListener('click', (event) => {
        // Verificar se o elemento clicado tem a classe 'snake-button'
        if (event.target.classList.contains('snake-button')) {
            event.preventDefault();
            snakeGameOptions(); // Chama a função snakeGameOptions quando um botão 'snake-button' é clicado
        }

        // Verificar se o elemento clicado tem o ID 'snakeGame'
        if (event.target.id === 'snakeGame') {
            event.preventDefault();
            snakeGame(); // Chama a função snakeGame quando o botão 'snakeGame' é clicado
        }

        // Verificar se o elemento clicado tem o ID 'homeButton'
        if (event.target.id === 'homeButton') {
            event.preventDefault();
            homepage(); // Chama a função homepage quando o botão 'homeButton' é clicado
        }
    });
});



// document.getElementById('registerBtn').addEventListener('click', registerUser);
// document.getElementById('loginBtn').addEventListener('click', loginUser);
// document.getElementById('verifyBtn').addEventListener('click', verifyCode);
// document.getElementById('logoutBtn').addEventListener('click', logoutUser);
// document.getElementById('getProfileBtn').addEventListener('click', getUserProfile);
// document.getElementById('listUsersBtn').addEventListener('click', listAllUsers);
// document.getElementById('updateProfileBtn').addEventListener('click', updateUserProfile);
// document.getElementById('addFriendBtn').addEventListener('click', addFriend);
// document.getElementById('removeFriendBtn').addEventListener('click', removeFriend);
// document.getElementById('blockUserBtn').addEventListener('click', blockUser);
// document.getElementById('unblockUserBtn').addEventListener('click', unblockUser);
// document.getElementById('getUserProfileBtn').addEventListener('click', getUserProfileByUsername);
// document.getElementById('delete-user-button').addEventListener('click', deleteUser);

