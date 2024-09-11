async function addFriend(friendUsername, displaySlidingMessage) {
	const accessToken = localStorage.getItem('access_token');
	if (!isUserInFriendsList(friendUsername)) {
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
			displaySlidingMessage('Friend added successfully!');
		} else {
			throw new Error('Failed to add friend');
		}
	} catch (error) {
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
	const accessToken = localStorage.getItem('access_token');
	if (!isUserBlocked(blockedUsername)) {
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
	} catch (error) {
		console.error('There was a problem with the fetch operation:', error);
	}
}

async function isUserBlocked(username) {
	const accessToken = localStorage.getItem('access_token');
	if (!accessToken) {
		console.error('No access token found');
		return false;
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
		return data.blocked_list.includes(username);
	} catch (error) {
		console.error('Error fetching blocked list:', error);
		return false;
	}
}

async function isUserInFriendsList(username) {
	const accessToken = localStorage.getItem('access_token');
	if (!accessToken) {
		console.error('No access token found');
		return false;
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
		if (friends.some(friend => friend.username === username)) {
			return true;
		}
	} catch (error) {
		console.error('Error fetching friend list:', error);
		return false;
	}
}

export { addFriend, removeFriend, blockUser, unblockUser, fetchBlockedList }