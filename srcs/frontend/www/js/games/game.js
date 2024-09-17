async function createRoom(authorizedUser) {
	const game_accessToken = localStorage.getItem('access_token');
	let data;

	try {
		const response = await fetch('/game/create-room/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${game_accessToken}`
			},
			body: JSON.stringify({
				authorized_user: authorizedUser
			}),
		});
		data = await response.json();
		console.log("CreateRoom: ", data);
		if (!response.ok) {
			console.error('error:', data);
		}
	} catch (error) {
		console.error('Error creating room:', error);
	}

	return data.code;
}

export { createRoom }