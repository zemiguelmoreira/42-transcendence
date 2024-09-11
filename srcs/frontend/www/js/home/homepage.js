function makeHomePage(data) {
	return `
	<div class="navbar-div">
		<nav class="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
			<div class="container-fluid">
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarSupportedContent">
					<ul class="navbar-nav me-auto mb-2 mb-lg-0">
						<li class="nav-item">
							<a class="nav-link active" aria-current="page" href="" id="homeButton">HOME</a>
						</li>
						<li class="nav-item">
							<a class="nav-link" id="chatButton" href="">CHAT</a>
						</li>
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="" role="button" data-bs-toggle="dropdown" aria-expanded="false">GAMES</a>
							<ul class="dropdown-menu">
								<li><a id="pong-navbar" class="dropdown-item" href="">Pong</a></li>
								<li><a id="snake-navbar" class="dropdown-item" href="">Snake</a></li>
							</ul>
						</li>
					</ul>
					<form id="search-form" class="d-flex" role="search">
						<input id="search-input" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
						<button id="search-btn" class="btn btn-outline-success" type="submit">Search</button>
					</form>
					<ul class="navbar-nav">
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="" role="button" data-bs-toggle="dropdown" aria-expanded="false">
								<img src="${data.profile.profile_image_url}" alt="User Icon" width="30" height="30">
							</a>
							<ul class="dropdown-menu dropdown-menu-end">
								<li><a class="dropdown-item" id="viewProfile" href="">Profile</a></li>
								<li><a class="dropdown-item" id="viewSettings" href="">Settings</a></li>
								<li>
									<hr class="dropdown-divider">
								</li>
								<li><a class="dropdown-item" id="logOut" href="">Logout</a></li>
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</nav>
	</div>
	<div class="home-box" id="mainContent">
		<div class="card" style="width: 18rem;">
			<img src="/files/minipong.png" class="card-img-top" alt="Enter to play">
			<div class="card-body">
				<h5 class="card-title">PONG</h5>
				<p class="card-text">Classic table tennis game with paddles and a ball. The goal is to score points.</p>
				<a href="" id="pong-card" class="btn btn-primary card-btn pong-button">Let's Play</a>
			</div>
		</div>
		<div class="card" style="width: 18rem;">
			<img src="/files/mini2snake.png" class="card-img-top" alt="Enter to play">
			<div class="card-body">
				<h5 class="card-title">SNAKE</h5>
				<p class="card-text">Game where a "snake" eats food to grow and must avoid walls, enemy and itself.</p>
				<a href="" id="snake-card" class="btn btn-primary card-btn snake-button">Let's Play</a>
			</div>
		</div>
		<div class="card" style="width: 18rem;">
			<img src="/files/minichat.png" class="card-img-top" alt="Enter to chat">
			<div class="card-body">
				<h5 class="card-title">CHAT</h5>
				<p class="card-text">Chat with others and invite friends for matchmaking and tournaments.</p>
				<a href="" class="btn btn-primary card-btn" id="chatCard">Let's Talk</a>
			</div>
		</div>
	</div>
	<div class="message-bar">
		<div id="slidingMessage" class="sliding-message"></div>
	</div>
	`;
}

function makeSimpleHomePage(data) {
	return `
	<div class="home-box" id="mainContent">
		<div class="card" style="width: 18rem;">
			<img src="/files/minipong.png" class="card-img-top" alt="Enter to play">
			<div class="card-body">
				<h5 class="card-title">PONG</h5>
				<p class="card-text">Classic table tennis game with paddles and a ball. The goal is to score points.</p>
				<a href="" id="pong-card" class="btn btn-primary card-btn pong-button">Let's Play</a>
			</div>
		</div>
		<div class="card" style="width: 18rem;">
			<img src="/files/mini2snake.png" class="card-img-top" alt="Enter to play">
			<div class="card-body">
				<h5 class="card-title">SNAKE</h5>
				<p class="card-text">Game where a "snake" eats food to grow and must avoid walls, enemy and itself.</p>
				<a href="" id="snake-card" class="btn btn-primary card-btn snake-button">Let's Play</a>
			</div>
		</div>
		<div class="card" style="width: 18rem;">
			<img src="/files/minichat.png" class="card-img-top" alt="Enter to chat">
			<div class="card-body">
				<h5 class="card-title">CHAT</h5>
				<p class="card-text">Chat with others and invite friends for matchmaking and tournaments.</p>
				<a href="" class="btn btn-primary card-btn" id="chatCard">Let's Talk</a>
			</div>
		</div>
	</div>
	`;
}

export { makeHomePage , makeSimpleHomePage }