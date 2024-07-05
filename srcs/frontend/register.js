function registerUser() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    console.log(username);
    console.log(email);
    console.log(password);

    fetch('/api/user/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        return response.json();
    })
    .then(data => {
        alert('User registered successfully!');
        console.log(data); // Log the response data if needed
        // You can redirect to another page or do other actions as needed
        // window.location.href = '/some-page/';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Registration failed. Please check the console for details.');
    });
}

document.getElementById('registerBtn').addEventListener('click', registerUser);
