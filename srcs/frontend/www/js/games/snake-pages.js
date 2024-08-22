let snakeLocalScriptLoaded = false;
let snakeRemoteScriptLoaded = false;
let snake4allScriptLoaded = false;

function snakeGameLocal(username) {
	try {
		document.getElementById('mainContent').innerHTML = `
		<div class="snake-content">
			<div class="snake-container">
				<div class="snake-box snake-score1">
					<span class="snake-ply1">Snake 1</span>
					<span class="snake-score1--value">00</span>
				</div>
				<div class="snake-logo">
					<img src="../../files/macro2snake.png" alt="Snake Logo">
				</div>
				<div class="snake-box snake-score2">
					<span class="snake-ply2">Snake 2</span>
					<span class="snake-score2--value">00</span>
				</div>
			</div>
			<div class="snake-box"><canvas id="gameCanvasSnakeLocal" width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Error loading:', error);
	}
	if (!snakeLocalScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.src = '../../js/games/snake-local.js';
		scriptElement.onload = () => {
			snakeLocalScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Error loading script snake-local.js');
		};
		document.body.appendChild(scriptElement);
	} else {
		if (typeof initializeSnakeGame === 'function') {
			initializeSnakeGameLocal();
		}
	}
}

function snakeGameRemote(username) {
	try {
		document.getElementById('mainContent').innerHTML = `
		<div class="snake-content">
			<div class="snake-container">
				<div class="snake-box snake-score1">
					<span class="snake-ply1">Snake 1</span>
					<span class="snake-score1--value">00</span>
				</div>
				<div class="snake-logo">
					<img src="../../files/macro2snake.png" alt="Snake Logo">
				</div>
				<div class="snake-box snake-score2">
					<span class="snake-ply2">Snake 2</span>
					<span class="snake-score2--value">00</span>
				</div>
			</div>
			<div class="snake-box"><canvas id="gameCanvasSnakeRemote" width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Error loading:', error);
	}
	if (!snakeRemoteScriptLoaded) {
		const scriptElement = document.createElement('script');
		scriptElement.src = '../../js/games/snake-remote.js';
		scriptElement.onload = () => {
			snakeRemoteScriptLoaded = true;
		};
		scriptElement.onerror = () => {
			console.error('Error loading script snake-remote.js');
		};
		document.body.appendChild(scriptElement);
	} else {
		if (typeof initializeSnakeGame === 'function') {
			initializeSnakeGameRemote();
		}
	}
}

function snakeGameFreeForAll(username) {
    try {
        document.getElementById('mainContent').innerHTML = `
        <div class="snake-content">
            <div class="snake-container">
                <div class="snake-box snake-score1">
                    <span class="snake-ply1">Snake 1</span>
                    <span class="snake-score1--value">00</span>
                </div>
                <div class="snake-box snake-score1">
                    <span class="snake-ply2">Snake 2</span>
                    <span class="snake-score1--value">00</span>
                </div>
                <div class="snake-logo">
                    <img src="../../files/macro2snake.png" alt="Snake Logo">
                </div>
                <div class="snake-box snake-score1">
                    <span class="snake-ply3">Snake 3</span>
                    <span class="snake-score1--value">00</span>
                </div>
				<div class="snake-box snake-score1">
                    <span class="snake-ply4">Snake 4</span>
                    <span class="snake-score1--value">00</span>
                </div>
            </div>
            <div class="snake-box"><canvas id="gameCanvasSnakeFreeForAll" width="980" height="420"></canvas></div>
        </div>
        `;
    } catch (error) {
        console.error('Error loading:', error);
    }
    if (!snake4allScriptLoaded) {
        const scriptElement = document.createElement('script');
        scriptElement.src = '../../js/games/snake-free-for-all.js';
        scriptElement.onload = () => {
            snake4allScriptLoaded = true;
            if (typeof initializeSnakeGameFreeForAll === 'function') {
                initializeSnakeGameFreeForAll(); 
            }
        };
        scriptElement.onerror = () => {
            console.error('Error loading script snake-free-for-all.js');
        };
        document.body.appendChild(scriptElement);
    } else {
        if (typeof initializeSnakeGameFreeForAll === 'function') {
            initializeSnakeGameFreeForAll(); 
        }
    }
}

export { snakeGameLocal , snakeGameRemote , snakeGameFreeForAll }