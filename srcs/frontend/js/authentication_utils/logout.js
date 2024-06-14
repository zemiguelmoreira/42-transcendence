
async function logout() {
    const userId = localStorage.getItem('user_id');  // Assumindo que o ID do usuário está armazenado no localStorage
    const csrfToken = getCsrfToken();  // Função para obter o token CSRF

    const response = await fetch('/api/users/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ user_id: userId })
    });

    if (response.ok) {
        // clean token frontend
        localStorage.removeItem('user_id');
        localStorage.removeItem('token');
        alert('Goodbye and thanks for playing!');
        // Redireciona o usuário para a página de login ou home
        window.location.href = '/';
    } else {
        const errorData = await response.json();
        alert('Error: ' + errorData.error);
    }
}

export { logout }