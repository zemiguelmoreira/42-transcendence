document.addEventListener('DOMContentLoaded', function() {
    async function getCsrfTokenGame() {
        const response = await fetch('https://localhost/api/game/get-csrf-token/', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to get CSRF token');
        }

        const data = await response.json();
        return data.csrfToken;
    }

    async function handleKeyPress(event) {
        const keyCode = event.keyCode || event.which;

        try {
            const csrfToken = await getCsrfTokenGame();

            const response = await fetch('https://localhost/api/game/single/local/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ keyCode: keyCode })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log(`Key pressed: ${data.message}`); 
            const content = document.getElementById('content');
            // content.innerHTML = ''; // Limpa o conteúdo anterior
            // content.innerHTML = data.message;


        } catch (error) {
            console.error('Error:', error);
        }
    }

    document.addEventListener("keydown", handleKeyPress);
});
