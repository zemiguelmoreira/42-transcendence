// function to add, remove, block and unblock users

async function addFriend(friendUsername, displaySlidingMessage) {
	const accessToken = localStorage.getItem('access_token');

	console.log('Adding friend:', friendUsername);


	if (!isUserInFriendsList(friendUsername)) {
		console.log('User is already in friends list');
		return;
	}

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
			console.log('Friend added successfully!');
			displaySlidingMessage('Friend added successfully!');
		} else {
			throw new Error('Failed to add friend');
		}
	} catch (error) {
		console.error('Error adding friend:', error.message);
		displaySlidingMessage('Failed to add friend. Please try again.');
	}
}

async function removeFriend(friendUsername, displaySlidingMessage) {
	const accessToken = localStorage.getItem('access_token');

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
			console.log('Friend removed successfully!');
			displaySlidingMessage('Friend removed successfully!');
		} else {
			throw new Error('Failed to remove friend');
		}
	} catch (error) {
		console.error('Error removing friend:', error.message);
		displaySlidingMessage('Failed to remove friend. Please try again.');
	}
}

async function blockUser(blockedUsername, displaySlidingMessage) {
	const accessToken = localStorage.getItem('access_token');


	if (!isUserBlocked(blockedUsername)) {
		console.log('User is already blocked');
		return;
	}

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
			console.log('User blocked successfully!');
			displaySlidingMessage('User blocked successfully!');
		} else {
			throw new Error('Failed to block user');
		}
	} catch (error) {
		console.error('Error blocking user:', error.message);
		displaySlidingMessage('Failed to block user. Please try again.');
	}
}

async function unblockUser(blockedUsername, displaySlidingMessage) {
	const accessToken = localStorage.getItem('access_token');
	// const blockedUsername = document.getElementById('blockUsername').value;
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
			console.log('User unblocked successfully!');
			displaySlidingMessage('User unblocked successfully!');
		} else {
			throw new Error('Failed to unblock user');
		}
	} catch (error) {
		console.error('Error unblocking user:', error.message);
		displaySlidingMessage('Failed to unblock user. Please try again.');
	}
}

async function fetchBlockedList() {
	const accessToken = localStorage.getItem('access_token');
	console.log('fetch');

	if (!accessToken) {
		alert('You are not logged in!');
		return;
	}

	try {
		const response = await fetch('/api/profile/blocked_list/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		});

		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}

		const data = await response.json();
		console.log('Blocked List:', data.blocked_list);
	} catch (error) {
		console.error('There was a problem with the fetch operation:', error);
	}
}

async function isUserBlocked(username) {
	console.log('Checking if user: ', username, ' is blocked:');
	const accessToken = localStorage.getItem('access_token');

	if (!accessToken) {
		console.error('No access token found');
		return false; // Retorna falso se não houver token
	}

	try {
		const response = await fetch('/api/profile/blocked_list/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		});

		if (!response.ok) {
			throw new Error('Network response was not ok: ' + response.statusText);
		}

		const data = await response.json();
		console.log('Blocked List:', data.blocked_list);

		// Verifica se o username está na lista de bloqueados
		return data.blocked_list.includes(username);

	} catch (error) {
		console.error('Error fetching blocked list:', error);
		return false; // Retorna falso em caso de erro
	}
}

async function isUserInFriendsList(username) {
	const accessToken = localStorage.getItem('access_token');

	if (!accessToken) {
		console.error('No access token found');
		return false; // Retorna falso se não houver token
	}

	try {
		const response = await fetch('/api/profile/friend_list/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			}
		});

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const data = await response.json();
		const friends = data.friends;

		console.log('Friend List:', friends);
		// Verifica se o username está na lista de amigos

		if (friends.some(friend => friend.username === username)) {
			console.log('User is in friends list');
			return true;
		}

		// return friends.some(friend => friend.username === username);

	} catch (error) {
		console.error('Error fetching friend list:', error);
		return false; // Retorna falso em caso de erro
	}
}

export { addFriend, removeFriend, blockUser, unblockUser, fetchBlockedList }