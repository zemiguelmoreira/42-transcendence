let socket = null;

function connectWebSocket() {
    const accessToken = localStorage.getItem('accessToken');
    socket = new WebSocket(`wss://${window.location.host}/api/ws/user_status/?token=${accessToken}`);

    socket.onopen = function(event) {
        // console.log('WebSocket connected');
    };

    socket.onmessage = function(event) {
        // console.log('Message from server:', event.data);
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        // localStorage.removeItem('accessToken');
        // localStorage.removeItem('refreshToken');
    };

    socket.onclose = function(event) {
        // console.log('WebSocket closed:', event);
        // localStorage.removeItem('accessToken');
        // localStorage.removeItem('refreshToken');
    };
}


async function registerUser() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm_password = document.getElementById('confirmPassword').value;

    try {
        const response = await fetch('/api/user/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                confirm_password: confirm_password,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('User registered successfully!');
        } else {
            if (data.username) {
                // throw new Error(data.username[0]);
                // console.log(data.username[0]);
            } else {
                // console.log(data.detail);
                // throw new Error(data.detail || 'Registration failed');
            }
        }
    } catch (error) {
        console.error('Error during registration:', error.message);
        alert('Registration failed. Please check your inputs and try again.');
    }
}

let accessToken = '';  // Token JWT para uso posterior

let global_username = "";
async function loginUser() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access;  // Salve o token de acesso
            // console.log("Access token: " + accessToken);
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('verifyForm').style.display = 'block';
            await fetchQRCode();
        } else {
            const errorText = await response.text();
            try {
                const data = JSON.parse(errorText);
                throw new Error(data.detail || 'Login failed');
            } catch (e) {
                throw new Error('Login failed: ' + errorText);
            }
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        document.getElementById('message').textContent = 'Login failed. Please check your username and password.';
    }
}

async function fetchQRCode() {
    try {
        const response = await fetch('/api/profile/get_qr_code/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            // console.log(data.svg);
            document.getElementById('qrcode').innerHTML = data.svg;
        } else {
            throw new Error('Failed to fetch QR code.');
        }
    } catch (error) {
        console.error('Error during fetching QR code:', error.message);
        document.getElementById('verifyMessage').textContent = 'Failed to fetch QR code.';
    }
}

async function verifyCode() {
    const username = document.getElementById('loginUsername').value;
    const code = document.getElementById('code').value;

    try {
        const response = await fetch('/api/token/verify-2fa/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                username: username,
                code: code,
            }),
        });

        if (response.ok) {
            const data = await response.json();

            const accessToken = data.access;
            const refreshToken = data.refresh;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            global_username = username;
            // console.log("2FA verified successfully.");
            document.getElementById('verifyMessage').textContent = '2FA verification successful. You are logged in.';
            alert('2FA verification successful. You are logged in.');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('verifyForm').style.display = 'none';
            connectWebSocket();
        } else {
            const errorText = await response.text();
            try {
                const data = JSON.parse(errorText);
                throw new Error(data.detail || 'Invalid or expired 2FA code.');
            } catch (e) {
                throw new Error('Invalid or expired 2FA code: ' + errorText);
            }
        }
    } catch (error) {
        console.error('Error during 2FA verification:', error.message);
        document.getElementById('verifyMessage').textContent = 'Invalid or expired 2FA code.';
    }
}

function logoutUser() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    socket.close();
    alert('Logout successful!');
}

async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refreshToken,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const accessToken = data.access;
            localStorage.setItem('accessToken', accessToken);
            alert('Token refreshed successfully!');
            return accessToken;
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Token refresh failed');
        }
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        return null;
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken) {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const tokenExpiration = new Date(tokenPayload.exp * 1000);
        const currentDateTime = new Date();

        if (tokenExpiration < currentDateTime) {
            const newAccessToken = await refreshAccessToken(refreshToken);
            if (!newAccessToken) {
                alert('Session expired. Please login again.');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            } else {
                connectWebSocket();
            }
        } else {
            alert('User already logged in!');
            connectWebSocket();
        }
    }
});

async function getUserProfile() {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('/api/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            // console.log(data);
            alert('Profile retrieved successfully!');
            updateProfileElements(data.user, data.profile);
        } else {
            throw new Error('Failed to fetch profile');
        }
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        alert('Failed to fetch profile. Please try again.');
    }
}

async function listAllUsers() {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('/api/profile/all_users/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            // console.log(data);
            alert('Users listed in console.');
        } else {
            throw new Error('Failed to fetch users');
        }
    } catch (error) {
        console.error('Error fetching users:', error.message);
        alert('Failed to fetch users. Please try again.');
    }
}

async function updateUserProfile() {
    const accessToken = localStorage.getItem('accessToken');
    const bio = document.getElementById('bioForm').value;
    const alias_name = document.getElementById('alias_nameForm').value;
    const profileImage = document.getElementById('profileImageUpload').files[0];

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('alias_name', alias_name);
    if (profileImage) {
        formData.append('profile_image', profileImage);
    }

    try {
        const response = await fetch('/api/profile/update_profile/', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
        });

        if (response.ok) {
            alert('Profile updated successfully!');
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error.message);
        alert('Failed to update profile. Please try again.');
    }
}

async function addFriend() {
    const accessToken = localStorage.getItem('accessToken');
    const friendUsername = document.getElementById('friendUsername').value;
    try {
        const response = await fetch('/api/profile/add_friend/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                friend_username: friendUsername,
            }),
        });

        if (response.ok) {
            alert('Friend added successfully!');
        } else {
            throw new Error('Failed to add friend');
        }
    } catch (error) {
        console.error('Error adding friend:', error.message);
        alert('Failed to add friend. Please try again.');
    }
}

async function removeFriend() {
    const accessToken = localStorage.getItem('accessToken');
    const friendUsername = document.getElementById('friendUsername').value;
    try {
        const response = await fetch('/api/profile/remove_friend/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                friend_username: friendUsername,
            }),
        });

        if (response.ok) {
            alert('Friend removed successfully!');
        } else {
            throw new Error('Failed to remove friend');
        }
    } catch (error) {
        console.error('Error removing friend:', error.message);
        alert('Failed to remove friend. Please try again.');
    }
}

async function blockUser() {
    const accessToken = localStorage.getItem('accessToken');
    const blockedUsername = document.getElementById('blockUsername').value;
    try {
        const response = await fetch('/api/profile/block_user/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                blocked_username: blockedUsername,
            }),
        });

        if (response.ok) {
            alert('User blocked successfully!');
        } else {
            throw new Error('Failed to block user');
        }
    } catch (error) {
        console.error('Error blocking user:', error.message);
        alert('Failed to block user. Please try again.');
    }
}

async function unblockUser() {
    const accessToken = localStorage.getItem('accessToken');
    const blockedUsername = document.getElementById('blockUsername').value;
    try {
        const response = await fetch('/api/profile/unblock_user/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                blocked_username: blockedUsername,
            }),
        });

        if (response.ok) {
            alert('User unblocked successfully!');
        } else {
            throw new Error('Failed to unblock user');
        }
    } catch (error) {
        console.error('Error unblocking user:', error.message);
        alert('Failed to unblock user. Please try again.');
    }
}

async function getUserProfileByUsername() {
    const accessToken = localStorage.getItem('accessToken');
    const username = document.getElementById('searchUsername').value;
    // console.log(username);

    try {
        const response = await fetch(`/api/profile/get_user_profile/?username=${username}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            // console.log(data);
            alert('User profile retrieved successfully!');
            // Atualize os elementos HTML com os dados do perfil
            updateProfileElements(data.user, data.profile);
        } else {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to retrieve user profile');
        }
    } catch (error) {
        console.error('Error retrieving user profile:', error.message);
        alert('Failed to retrieve user profile. Please try again.');
    }
}

function updateProfileElements(user, profile) {
    document.getElementById('profileImage').src = profile.profile_image_url || '';
    document.getElementById('username').textContent = user.username;
    document.getElementById('email').textContent = user.email;
    document.getElementById('is_logged_in').textContent = profile.is_logged_in;
    document.getElementById('aliasName').textContent = profile.alias_name;
    document.getElementById('bio').textContent = profile.bio;
    document.getElementById('twoFactorSecret').textContent = profile.two_factor_secret;
    document.getElementById('rank-pong').textContent = profile.pong_rank;
    document.getElementById('rank-snake').textContent = profile.snake_rank;
    document.getElementById('wins').textContent = profile.wins;
    document.getElementById('losses').textContent = profile.losses;
    document.getElementById('pongWins').textContent = profile.pong_wins;
    document.getElementById('pongLosses').textContent = profile.pong_losses;
    document.getElementById('snakeWins').textContent = profile.snake_wins;
    document.getElementById('snakeLosses').textContent = profile.snake_losses;

    const friendList = document.getElementById('friendList');
    friendList.innerHTML = '';
    profile.friend_list.forEach(friend => {
        const li = document.createElement('li');
        li.textContent = friend;
        friendList.appendChild(li);
    });

    const blockedList = document.getElementById('blockedList');
    blockedList.innerHTML = '';
    profile.blocked_list.forEach(blocked => {
        const li = document.createElement('li');
        li.textContent = blocked;
        blockedList.appendChild(li);
    });

    updateMatchHistoryTable('snakeMatchHistory', profile.snake_match_history);
    updateMatchHistoryTable('pongMatchHistory', profile.pong_match_history);
}

function updateMatchHistoryTable(tableId, matchHistory) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    matchHistory.forEach(match => {
        const row = document.createElement('tr');
        const timestamp = document.createElement('td');
        timestamp.textContent = match.timestamp;

        const winnerCell = document.createElement('td');
        winnerCell.textContent = match.winner;

        const winnerScoreCell = document.createElement('td');
        winnerScoreCell.textContent = match.winner_score;

        const loserCell = document.createElement('td');
        loserCell.textContent = match.loser;
        
        const loserScoreCell = document.createElement('td');
        loserScoreCell.textContent = match.loser_score;


        row.appendChild(timestamp);
        row.appendChild(winnerCell);
        row.appendChild(winnerScoreCell);
        row.appendChild(loserCell);
        row.appendChild(loserScoreCell);
        tableBody.appendChild(row);
    });
}

async function deleteUser() {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        alert('You are not logged in!');
        return;
    }

    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch('/api/profile/delete_user/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 204) {
            alert('User deleted successfully');
            localStorage.removeItem('accessToken');  // Remove token from local storage
            localStorage.removeItem('refreshToken'); // Remove refresh token from local storage
            // window.location.href = '/login';  // Redirect to login page
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

document.getElementById('registerBtn').addEventListener('click', registerUser);
document.getElementById('loginBtn').addEventListener('click', loginUser);
document.getElementById('verifyBtn').addEventListener('click', verifyCode);
document.getElementById('logoutBtn').addEventListener('click', logoutUser);
document.getElementById('getProfileBtn').addEventListener('click', getUserProfile);
document.getElementById('listUsersBtn').addEventListener('click', listAllUsers);
document.getElementById('updateProfileBtn').addEventListener('click', updateUserProfile);
document.getElementById('addFriendBtn').addEventListener('click', addFriend);
document.getElementById('removeFriendBtn').addEventListener('click', removeFriend);
document.getElementById('blockUserBtn').addEventListener('click', blockUser);
document.getElementById('unblockUserBtn').addEventListener('click', unblockUser);
document.getElementById('getUserProfileBtn').addEventListener('click', getUserProfileByUsername);
document.getElementById('delete-user-button').addEventListener('click', deleteUser);
