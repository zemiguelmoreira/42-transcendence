document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.addEventListener('click', function() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        // Montando os dados do formulário em um objeto
        const formData = {
            username: username,
            password: password
        };

        // Fazendo uma solicitação POST para obter o token de acesso
        fetch('/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to login');
            }
            return response.json();
        })
        .then(data => {
            // Armazenando o token de acesso no localStorage
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            // Exibindo mensagem de sucesso
            document.getElementById('message').textContent = 'Login successful!';
            // Redirecionando para outra página ou realizando outra ação após o login
            // window.location.href = '/dashboard';  // Exemplo de redirecionamento
        })
        .catch(error => {
            console.error('Error:', error);
            // Exibindo mensagem de erro
            document.getElementById('message').textContent = 'Failed to login';
        });
    });
});
