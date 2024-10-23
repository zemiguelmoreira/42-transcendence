import { runPongMatch } from './pong-tournament.js';
import { pongCanvasPage } from './pong-pages.js';
import { displaySlidingMessage } from '../utils/utils1.js';
import chatSocketInstance from "../chat/chat_socket.js";

function confetti() {
	let W = window.innerWidth;
	let H = window.innerHeight;
	const canvas = document.getElementById("canvas-confetti");
	const context = canvas.getContext("2d");
	const maxConfettis = 100;
	const particles = [];
	const possibleColors = [
		"DodgerBlue",
		"OliveDrab",
		"Gold",
		"Pink",
		"SlateBlue",
		"LightBlue",
		"Gold",
		"Violet",
		"PaleGreen",
		"SteelBlue",
		"SandyBrown",
		"Chocolate",
		"Crimson"
	];

	function randomFromTo(from, to) {
		return Math.floor(Math.random() * (to - from + 1) + from);
	}

	function confettiParticle() {
		this.x = Math.random() * W;
		this.y = Math.random() * H - H;
		this.r = randomFromTo(11, 33);
		this.d = Math.random() * maxConfettis + 11;
		this.color = possibleColors[Math.floor(Math.random() * possibleColors.length)];
		this.tilt = Math.floor(Math.random() * 33) - 11;
		this.tiltAngleIncremental = Math.random() * 0.07 + 0.05;
		this.tiltAngle = 0;
		this.draw = function () {
			context.beginPath();
			context.lineWidth = this.r / 2;
			context.strokeStyle = this.color;
			context.moveTo(this.x + this.tilt + this.r / 3, this.y);
			context.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 5);
			return context.stroke();
		};
	}

	function Draw() {
		const results = [];
		requestAnimationFrame(Draw);
		context.clearRect(0, 0, W, window.innerHeight);
		for (var i = 0; i < maxConfettis; i++) {
			results.push(particles[i].draw());
		}
		let particle = {};
		let remainingFlakes = 0;
		for (var i = 0; i < maxConfettis; i++) {
			particle = particles[i];
			particle.tiltAngle += particle.tiltAngleIncremental;
			particle.y += (Math.cos(particle.d) + 3 + particle.r / 2) / 2;
			particle.tilt = Math.sin(particle.tiltAngle - i / 3) * 15;
			if (particle.y <= H) remainingFlakes++;
			if (particle.x > W + 30 || particle.x < -30 || particle.y > H) {
				particle.x = Math.random() * W;
				particle.y = -30;
				particle.tilt = Math.floor(Math.random() * 10) - 20;
			}
		}
		return results;
	}
	window.addEventListener(
		"resize",
		function () {
			W = window.innerWidth;
			H = window.innerHeight;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		},
		false
	);
	for (var i = 0; i < maxConfettis; i++) {
		particles.push(new confettiParticle());
	}
	canvas.width = W;
	canvas.height = H;
	Draw();
}

function isPowerOfTwo(num) {
	return (num > 0) && (num & (num - 1)) === 0;
}

function initializeTournament(playersObj, username, dataUsername) {
	if (typeof playersObj !== 'object' || Object.keys(playersObj).length === 0) {
		console.error("Erro: A variável 'players' deve ser um objeto válido com jogadores.");
		return;
	}

	const players = Object.values(playersObj);

	if (!isPowerOfTwo(players.length)) {
		console.error("Erro: Número de jogadores deve ser uma potência de dois.");
		return;
	}

	function pongGameTournamentBracket(players) {

		const numPlayers = players.length;
		const numRounds = Math.log2(numPlayers);
		let numMatches = numPlayers / 2;
		let currentRound = [...players];
		const baseHeight = 134.5;
		const columnWidth = 30;
		const totalHeight = baseHeight * numMatches;

		const tournamentBracket = document.getElementById('tournament-bracket');
		tournamentBracket.innerHTML = '';
		if (numPlayers / 2 <= 4) {
			tournamentBracket.style.alignItems = 'center';
		} else {
			tournamentBracket.style.alignItems = 'start';
		}

		for (let round = 0; round < numRounds; round++) {
			const extraRoundDiv = document.createElement('div');
			extraRoundDiv.className = 'round';
			extraRoundDiv.style.width = `${round === 0 ? 20 : columnWidth}px`;
			extraRoundDiv.style.height = `${totalHeight}px`;
			const roundDiv = document.createElement('div');
			roundDiv.className = 'round';
			roundDiv.style.height = `${totalHeight}px`;
			for (let match = 0; match < numMatches; match++) {
				const extraDivisionDiv = document.createElement('div');
				extraDivisionDiv.className = 'division';
				extraDivisionDiv.style.height = `${round === 0 ? baseHeight : totalHeight / numMatches}px`;
				extraDivisionDiv.style.width = `${columnWidth}px`;
				const divisionDiv = document.createElement('div');
				divisionDiv.className = 'division';
				divisionDiv.style.height = `${round === 0 ? baseHeight : totalHeight / numMatches}px`;
				const matchDiv = document.createElement('div');
				matchDiv.className = 'match';
				const canvas = document.createElement('canvas');
				canvas.width = columnWidth;
				canvas.height = totalHeight / numMatches;
				extraDivisionDiv.appendChild(canvas);
				const ctx = canvas.getContext("2d");
				ctx.globalCompositeOperation = "lighter";
				function drawNeonLine(x1, y1, x2, y2, width) {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.lineWidth = width;
					ctx.strokeStyle = "rgba(255, 0, 255, 0.2)";
					ctx.shadowColor = "rgba(255, 0, 255, 1)";
					ctx.shadowBlur = 10;
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.lineWidth = 2;
					ctx.strokeStyle = "rgba(255, 150, 255, 1)";
					ctx.shadowBlur = 10;
					ctx.stroke();
				}

				if (round === 0) {
					const player1 = document.createElement('div');
					player1.className = 'player btn btn-first';
					player1.id = `player1-${round}-${match}`;
					player1.innerText = currentRound[match * 2];
					matchDiv.appendChild(player1);
					const player2 = document.createElement('div');
					player2.className = 'player btn btn-second';
					player2.id = `player2-${round}-${match}`;
					player2.innerText = currentRound[match * 2 + 1];
					matchDiv.appendChild(player2);
				} else {
					const player1 = document.createElement('div');
					player1.className = 'player btn btn-first';
					player1.id = `player1-${round}-${match}`;
					player1.innerText = `Round ${round}`;
					matchDiv.appendChild(player1);
					const player2 = document.createElement('div');
					player2.className = 'player btn btn-second';
					player2.id = `player2-${round}-${match}`;
					player2.innerText = `Round ${round}`;
					matchDiv.appendChild(player2);
					drawNeonLine(2, (totalHeight / numMatches) * 0.25, columnWidth / 2, (totalHeight / numMatches) * 0.25, 2);
					drawNeonLine(columnWidth / 2, (totalHeight / numMatches) * 0.25, columnWidth / 2, (totalHeight / numMatches) * 0.75, 2);
					drawNeonLine(2, (totalHeight / numMatches) * 0.75, columnWidth / 2, (totalHeight / numMatches) * 0.75, 2);
					drawNeonLine(columnWidth / 2, (totalHeight / numMatches) * 0.5, columnWidth - 2, (totalHeight / numMatches) * 0.5, 2);
				}
				extraRoundDiv.appendChild(extraDivisionDiv);
				roundDiv.appendChild(divisionDiv);
				divisionDiv.appendChild(matchDiv);
			}
			tournamentBracket.appendChild(extraRoundDiv);
			tournamentBracket.appendChild(roundDiv);
			numMatches /= 2;
		}


		const penultimateRoundDiv = document.createElement('div');
		penultimateRoundDiv.className = 'round';
		penultimateRoundDiv.style.width = `${columnWidth}px`;
		penultimateRoundDiv.style.height = `${totalHeight}px`;
		const penultimateDivisionDiv = document.createElement('div');
		penultimateDivisionDiv.className = 'division';
		penultimateDivisionDiv.style.height = `${totalHeight}px`;
		penultimateDivisionDiv.style.width = `${columnWidth}px`;
		const canvas = document.createElement('canvas');
		canvas.width = columnWidth;
		canvas.height = totalHeight;
		penultimateDivisionDiv.appendChild(canvas);
		const ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.moveTo(2, totalHeight / 2);
		ctx.lineTo(columnWidth - 2, totalHeight / 2);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "rgba(255, 150, 255, 1)";
		ctx.stroke();
		penultimateRoundDiv.appendChild(penultimateDivisionDiv);
		tournamentBracket.appendChild(penultimateRoundDiv);
		const winnerRoundDiv = document.createElement('div');
		winnerRoundDiv.className = 'round';
		winnerRoundDiv.style.height = `${totalHeight}px`;
		const winnerDivisionDiv = document.createElement('div');
		winnerDivisionDiv.className = 'division';
		winnerDivisionDiv.style.height = `${totalHeight}px`;
		const winnerMatchDiv = document.createElement('div');
		winnerMatchDiv.className = 'match';
		const winner = document.createElement('div');
		winner.className = 'player btn btn-warning';
		winner.id = 'final-winner';
		winner.innerText = "Winner";
		winnerMatchDiv.appendChild(winner);
		winnerDivisionDiv.appendChild(winnerMatchDiv);
		winnerRoundDiv.appendChild(winnerDivisionDiv);
		tournamentBracket.appendChild(winnerRoundDiv);
	}

	let rounds = [];
	let currentRoundIndex = 0;
	let currentMatchIndex = 0;
	let winners = [];

	function generateInitialMatches(players) {
		let matches = [];
		for (let i = 0; i < players.length; i += 2) {
			matches.push([players[i], players[i + 1]]);
		}
		rounds.push(matches);
	}

	async function processMatchResult(winner) {
		winners.push(winner);
		currentMatchIndex++;
	}

	function generateNextRound() {
		currentRoundIndex++;
		currentMatchIndex = 0;
		let newMatches = [];
		for (let i = 0; i < winners.length; i += 2) {
			newMatches.push([winners[i], winners[i + 1]]);
		}
		rounds.push(newMatches);
		winners = [];
		displayNextMatch();
	}

	document.querySelector("#startMatchBtn").addEventListener("click", async () => {
		let currentMatch = rounds[currentRoundIndex][currentMatchIndex];
		let player1 = currentMatch[0];
		let player2 = currentMatch[1];
		const runPong = document.createElement('div');
		runPong.classList.add('invite-pending');
		runPong.id = 'runPong';
		runPong.innerHTML = pongCanvasPage();
		document.getElementById('root').appendChild(runPong);
		let winner = await runPongMatch(player1, player2, username);
		runPong.remove();
		await processMatchResult(winner);
		if (currentMatchIndex >= rounds[currentRoundIndex].length) {
			if (winners.length > 1) {
				generateNextRound();
			} else {
				document.getElementById("sm-match-box").innerText = "Final winner:\n" + winners[0];
				document.querySelector("#final-winner").innerText = winners[0];
				document.querySelector("#startMatchBtn").style.display = "none";
				document.getElementById("canvas-confetti").style.display = "block";
				displaySlidingMessage(`Congratulations to the winner ${winners[0]}!`);
				let message = `Congratulations to the winner ${winners[0]}!`;
				const messageData = {
					"type": "sys_message",
					"message": message
				};
				chatSocketInstance.send(messageData);
				confetti();
			}
		} else {
			displayNextMatch();
		}
	});

	function displayNextMatch() {
		if (currentRoundIndex < rounds.length && currentMatchIndex < rounds[currentRoundIndex].length) {
			const currentMatch = rounds[currentRoundIndex][currentMatchIndex];
			const player1 = currentMatch[0];
			const player2 = currentMatch[1];
			const player1Div = document.querySelector(`#player1-${currentRoundIndex}-${currentMatchIndex}`);
			if (player1Div) player1Div.innerText = player1;
			const player2Div = document.querySelector(`#player2-${currentRoundIndex}-${currentMatchIndex}`);
			if (player2Div) player2Div.innerText = player2;
			const smPlayer1 = document.querySelector("#sm-player1");
			const smPlayer2 = document.querySelector("#sm-player2");
			if (smPlayer1) smPlayer1.innerText = `Player 1: ${player1}`;
			if (smPlayer2) smPlayer2.innerText = `Player 2: ${player2}`;
			let message = `The next match will be ${ player1 } vs ${ player2 }. Be ready!`;
			displaySlidingMessage(message);
			const messageData = {
				"type": "sys_message",
				"message": message
			};
			chatSocketInstance.send(messageData);


		}
	}

	generateInitialMatches(players);
	pongGameTournamentBracket(players);
	displayNextMatch();
}

export { initializeTournament };
