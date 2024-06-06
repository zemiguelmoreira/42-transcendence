
import { getCsrfToken } from "../utils/csrf.js";
import { userName } from "../login/login.js";

// const form = document.getElementById('user-search-form');


async function getIdbyName( userName ) {

    try {

        const csrfToken = await getCsrfToken(); // Obter o token CSRF

        const dados = {
            user: userName,
        };

        const response = await fetch(`https://localhost/api/users/get-user-id/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Adicionando o Content-Type correto
                'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
                'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
            },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        console.log(data);
        return (data.id);
    } catch (error) {
        console.error('Error:', error);
        return "0";
    };
}

function myProfile() { 

    const userIdInput = document.getElementById('my-profile');

    console.log(userIdInput)

    userIdInput.addEventListener('click', async function (event) {
        event.preventDefault();


        try {
            console.log( userName );
            const userId = await getIdbyName( userName );

            const csrfToken = await getCsrfToken(); // Obter o token CSRF

            const response = await fetch(`https://localhost/api/users/user-profile/${userId}/`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();

            // Atualizar o DOM com os dados do usuário
            const rootDiv = document.getElementById('root');
            rootDiv.innerHTML = `
                <h1>${data.username}</h1>
                <p>Email: ${data.email}</p>
                <p>Photo Path: ${data.photo_path}</p>
            `;
        } catch (error) {
            console.error('Error:', error);
        }
    });
}


export { myProfile }