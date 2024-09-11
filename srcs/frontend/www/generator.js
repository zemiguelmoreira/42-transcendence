document.getElementById('startGameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user1 = document.getElementById('user1').value;
    const user2 = document.getElementById('user2').value;
    const gameType = document.getElementById('gameType').value;
    const timestamp = new Date().toISOString();
    const score1 = Math.floor(Math.random() * 100);
    const score2 = Math.floor(Math.random() * 100);
    let winner_score;
    let loser_score;
    let winner;
    let loser;

    if (score1 > score2) {
        winner_score = score1;
        loser_score = score2;
        winner = user1;
        loser = user2;
    } else {
        winner_score = score2;
        loser_score = score1;
        winner = user2;
        loser = user1;
    }
    try {
        const response = await fetch('/api/profile/update_match_history/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
                'winner': winner,
                'winner_score': winner_score,
                'loser': loser,
                'game_type': gameType,
                'loser_score': loser_score,
                'timestamp': timestamp
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
