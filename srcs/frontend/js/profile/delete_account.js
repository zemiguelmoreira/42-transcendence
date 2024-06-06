import { getCsrfToken } from "../utils/csrf.js";
import { userName } from "../login/login.js";
import { getIdbyName } from "./myprofile.js";

function deleteProfile() {
    const userIdInput = document.getElementById('delete-account');
    
    if (!userIdInput) {
        console.error('Button with id "delete-account" not found');
        return;
    }

    userIdInput.addEventListener('click', async function (event) {
        event.preventDefault();

        try {
            const userId = await getIdbyName(userName);
            const csrfToken = await getCsrfToken(); // Obter o token CSRF

            const response = await fetch(`https://localhost/api/users/delete-account/${userId}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user account');
            }

            const data = await response.json();

            const rootDiv = document.getElementById('root');
            rootDiv.innerHTML = "Deleted";
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

export { deleteProfile };
