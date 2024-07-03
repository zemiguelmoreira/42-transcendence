import { getCsrfToken } from "../utils/csrf.js";
// Obtem o user id do user que está login
async function getIdbyName(username) {
    console.log(username)
    const csrfToken = await getCsrfToken(); // Obter o token CSRF
    const dados = { user: username };

    const response = await fetch(`user/get-user-id/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Adicionando o Content-Type correto
            'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
            'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
        },
        body: JSON.stringify(dados),
    });

    if (!response.ok) {
        // throw new Error('Failed to fetch user profile');
        return null;
    }
    const data = await response.json(); 
    return data.id;
}


async function getNamebyId(user_id) {
    try {
        const csrfToken = await getCsrfToken(); // Obter o token CSRF
        const dados = { id: user_id };

        const response = await fetch(`user/get-user-username/`, {
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
        // console.log("id: ");
        console.log(data);
        console.log(data.username);
        return data.username;
    } catch (error) {
        console.error('Error:', error);
        return null;
    };
}

export { getIdbyName, getNamebyId }