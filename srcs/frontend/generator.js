document.getElementById('startGameForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user1 = document.getElementById('user1').value;
    const user2 = document.getElementById('user2').value;
    const gameType = document.getElementById('gameType').value;
    const timestamp = new Date().toISOString(); // Adiciona o timestamp

    try {
        const response = await fetch('/api/profile/update_match_history/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
                user1,
                user2,
                game_type: gameType,
                user1_score: Math.floor(Math.random() * 100),
                user2_score: Math.floor(Math.random() * 100),
                timestamp: timestamp // Envia o timestamp
            }),
        });

        if (response.ok) {
            alert('Match data sent successfully!');
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send match data');
        }
    } catch (error) {
        console.error('Error:', error.message);
        alert('Failed to send match data. Please try again.');
    }
});

