import { logout } from "./utils/session.js"

function createNavBarLoggedOut() {
	return `
	<div class="container-fluid">
		<a class="navbar-brand" href="" id="home">Transcendence</a>
		<button class="navbar-toggler border border-0" type="button" data-bs-toggle="collapse"
			data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false"
			aria-label="Toggle navigation">
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarNavDropdown">
			<ul class="navbar-nav ms-auto">
				<li class="nav-item">
					<button id="signInNavBtn" type="button" class="btn btn-dark me-3" data-page="signin">Sign in</button>
				</li>
				<li class="nav-item">
					<button id="signUpNavBtn" class="btn btn-primary" type="button" data-page="register">Get started</button>
				</li>
			</ul>
		</div>
	</div>`;
}

function createNavBarLoggedIn() {
	return `
	<div class="container-fluid">
		<a class="navbar-brand" href="" id="home">Transcendence</a>
		<button class="navbar-toggler border border-0" type="button" data-bs-toggle="collapse"
			data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false"
			aria-label="Toggle navigation">
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarNavDropdown">
			<ul class="navbar-nav ms-4 me-auto">
				<li class="nav-item">
					<a id="testeLink" class="nav-link" aria-current="page" href="" data-value="teste">link teste</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="" id="gameLink" data-value="game">Game</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="" data-value="link_login">link login</a>
				</li>
			</ul>
			<div class="teste">
				<form id="search-form" class="d-flex" role="search">
					<input id="search-input" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
					<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
				</form>
				<div class="results" id="results"></div>
			</div>
			<ul class="navbar-nav ms-auto">
				<div id="mydrop1" class="dropdown">
					<a id="mydrop" href="" classs="dropdown-toggle border border-0 ms-3" role="button" data-bs-toggle="dropdown" aria-expanded="false">
						<img src="/assets/avatar.png" class="rounded-circle" alt="avatar">
					</a>
					<ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
						<li><a id="profileNavBtn" class="dropdown-item" href="#" data-value="profile">my profile</a></li>
						<li><a id="logoutNavBtn" class="dropdown-item" href="#">logout</a></li>
					</ul>
				</div>
			</ul>
		</div>
	</div>`;
}


function handlerNavbarButtons() {
    const signInBtn = document.getElementById('signInNavBtn');
    if (signInBtn) {
		signInBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Impede o comportamento padrão do link ou botão
            loadPage('login');
        });
    }

    const signUpBtn = document.getElementById('signUpNavBtn');
    if (signUpBtn) {
		signUpBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Impede o comportamento padrão do link ou botão
            loadPage('register');
        });
    }

    const profileBtn = document.getElementById('profileNavBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Impede o comportamento padrão do link ou botão
            loadPage('profile');
        });
    }

    const logoutBtn = document.getElementById('logoutNavBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
			console.log('clocou logouyt');
			logout();
        });
    }
}

export { createNavBarLoggedIn, createNavBarLoggedOut, handlerNavbarButtons }