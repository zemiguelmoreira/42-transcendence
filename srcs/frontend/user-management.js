

document.addEventListener('DOMContentLoaded', function() {
    apiUrl = "10.11.245.25"
    document.getElementById('fetch-button').addEventListener('click', function() {
        fetch('https://' + apiUrl + '/api/users/profile/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data); // Inspecione os dados no console
            const userListDiv = document.getElementById('user-list');
            userListDiv.innerHTML = ''; // Limpa o conteúdo anterior

            if (data.length > 0) {
                data.forEach(user => {
                    const userDiv = document.createElement('div');
                    userDiv.innerHTML = `
                        <p>Username: ${user.username}</p>
                        <p>First Name: ${user.first_name}</p>
                        <p>Last Name: ${user.last_name}</p>
                        <p>Email: ${user.email}</p>
                        <p>Photo Path: ${user.photo_path}</p>
                        <hr>`;
                    userListDiv.appendChild(userDiv);
                });
            } else {
                userListDiv.innerText = 'No users found';
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            document.getElementById('user-list').innerText = 'Error fetching users';
        });
    });

    async function getCsrfToken() {
        const response = await fetch('https://' + apiUrl + '/api/users/get-csrf-token/', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to get CSRF token');
        }

        const data = await response.json();
        return data.csrfToken;
    }

    async function submitForm(event) {
        event.preventDefault();
        
        const csrfToken = await getCsrfToken();
        const formData = {
            username: document.getElementById('username').value,
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            photo_path: document.getElementById('photo-path').value,
        };

        const response = await fetch('https://' + apiUrl + '/api/users/profile/create/', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error:', errorData);
            alert('Error creating user profile');
            return;
        }

        const data = await response.json();
        console.log('Success:', data);
        alert('User profile created successfully!');
    }

    document.getElementById('user-form').addEventListener('submit', submitForm);
});
