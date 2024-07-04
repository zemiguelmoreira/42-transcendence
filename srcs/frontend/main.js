document.getElementById('register-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  fetch('/user/register/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
  })
  .then(response => response.json())
  .then(data => {
      console.log('Registration successful:', data);
  })
  .catch((error) => {
      console.error('Error:', error);
  });
});

document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  fetch('/user/login/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
      localStorage.setItem('token', data.access);
      console.log('Login successful:', data);
      getProfile();
  })
  .catch((error) => {
      console.error('Error:', error);
  });
});

function getProfile() {
  const token = localStorage.getItem('token');

  fetch('/user/profile/', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      const profileDiv = document.getElementById('profile');
      profileDiv.innerHTML = `<p>Username: ${data.username}</p><p>Email: ${data.email}</p>`;
  })
  .catch((error) => {
      console.error('Error:', error);
  });
}
