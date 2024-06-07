import { getIdbyName } from "./myprofile.js";
import { makeProfilePage } from "../html/profile_page.js";
import { getCsrfToken } from "../utils/csrf.js";

function searchUserForm() { 
    document.getElementById('search-form').addEventListener('submit', async function(event) {
        event.preventDefault(); 
    
        try {

            const csrfToken = await getCsrfToken();
            const query = document.getElementById('search-input').value;

            const userID = await getIdbyName(query);

            console.log("user id:");
            console.log(userID);
            
            const response = await fetch(`https://localhost/api/users/user-profile/${userID}/`, {
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
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

export { searchUserForm }