import { getCsrfToken } from "../utils/csrf.js";
import { userName } from "../login/login.js";
import { userNameReg } from "../login/register.js";
import { makeProfilePage } from "../html/profile_page.js";
import { deleteProfile } from "../profile/delete_account.js";

async function getIdbyName(userName) {
    try {
        const csrfToken = await getCsrfToken(); // Obter o token CSRF
        const dados = { user: userName };

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
        // console.log("id: ");
        // console.log(data.id);
        return data.id;
    } catch (error) {
        console.error('Error:', error);
        return "0";
    };
}

function myProfile() {
    const userIdInput = document.getElementById('my-profile');

    if (!userIdInput) {
        console.error('Button with id "my-profile" not found');
        return;
    }

    userIdInput.addEventListener('click', async function (event) {
        event.preventDefault();

        try {
            let curr_username;
            if (userName != "")
                curr_username = userName;
            else if( userNameReg != "")
                curr_username = userNameReg;
            
            const userId = await getIdbyName(curr_username);
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
            rootDiv.innerHTML = makeProfilePage(data);
            
            // Chama deleteProfile após carregar a página do perfil
            deleteProfile();
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

export { myProfile, getIdbyName, getIdbyName };