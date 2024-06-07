function createNavbar1() {
	return `<nav class="navbar navbar-expand-lg navbar-dark" id="navBar">
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
					<a class="nav-link" aria-current="page" href="" data-value="makelink">make link</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="" id="gameLink" data-value="makelink1">make link1</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="" data-value="makelink2">make link2</a>
				</li>
			</ul>
			<ul class="navbar-nav ms-auto">
				<li class="nav-item">
					<button id="signIn" type="button" class="btn btn-dark me-3">Sign in</button>
				</li>
				<li class="nav-item">
					<button id="register" class="btn btn-primary" type="button">Get started</button>
				</li>
			</ul>
		</div>
	</div>
</nav>`;
}


var navbar1 = createNavbar1();


function createNavbar2 () {
	return `<nav class="navbar navbar-dark">
	<div class="container-fluid">
	  <a class="navbar-brand" href="" id="home">Transcendence</a>
	</div>
</nav>`;
}


const navbar2 = createNavbar2();


function createNavbar3() {
	return `<nav class="navbar navbar-expand-lg navbar-dark" id="navBar">
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
			<form id="search-form" class="d-flex" role="search">
				<input id="search-input" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
				<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
			</form>
			<ul class="navbar-nav ms-auto">
				<div id="mydrop1" class="dropdown">
					<a id="mydrop" href="" class="dropdown-toggle border border-0 ms-3" role="button" data-bs-toggle="dropdown" aria-expanded="false"><img src="./assets/ialves-m.jpg" class="rounded-circle" alt="avatar"></a>
					<ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
						<li><a id="my-profile" class="dropdown-item" href="">my profile</a></li>
						<li><a class="dropdown-item" href="#">Another action</a></li>
						<li><a id="logOut" class="dropdown-item" href="#">logout</a></li>
					</ul>
				</div>
			</ul>
		</div>
	</div>
</nav>`;
}

const navbar3 = createNavbar3();

export { navbar1, navbar2, navbar3 }