
async function addFriend(friendUsername, displaySlidingMessage) {
	console.log('addFriend: ', friendUsername);

	const accessToken = localStorage.getItem('access_token');
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
	console.log('blockUser: ', blockedUsername);

	const accessToken = localStorage.getItem('access_token');
	// const blockedUsername = document.getElementById('blockUsername').value;
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

export { addFriend, removeFriend, blockUser, unblockUser , fetchBlockedList }