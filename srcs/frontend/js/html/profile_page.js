// function makeProfilePage( data ) {
// 	return `
// 	<div class="container my-5">
//         <h1>${data.username}</h1>
//         <p>Email: ${data.email}</p>
//         <p>Photo Path: ${data.photo_path}</p>
// 	</div>
//      <div class="bcontainer my-5">
//         <button id="change-account" class="button change-data">Change Data</button>
//         <button id="delete-account" class="button delete-account">Delete Account</button>
//     </div>
//     `;
// }


function makeProfilePage(data) {
	return `
		<div class="d-flex flex-column vh-100" id="reg">
			<nav class="navbar navbar-expand-xxl navbar-dark p-4" id="navBar">
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
								<a class="nav-link" href="" id="gameLink" data-value="game">Games</a>
							</li>
						</ul>
						<form id="search-form" class="d-flex ms-auto me-3" role="search">
							<input id="search-input" class="form-control me-2" type="search" placeholder="Search"
								aria-label="Search">
							<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
						</form>
						<ul class="navbar-nav flex-row mt-3 mt-xxl-0">
							<li class="nav-item">
								<button id="logOut" class="btn btn-primary w-100" type="button">logout</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			<div class="container profile-container my-6">
				<div class="row">
					<div class="col-lg-3 text-center">
						<div class="customTooltip">
							<a href="">
								<img src="/assets/avatar.png" alt="Profile Picture" class="profile-pic">
							</a>
							<span class="customTooltiptext">change your photo</span>
						</div>
						<div id="editProfile" class="d-grid mt-5 mx-auto">
							<button class="btn btn-secondary" type="button">edit profile</button>
						</div>
					</div>
					<div class="col-lg-9 mt-5 profile-info">
						<h1>${data.username}</h1>
						<p><strong>Username:</strong> ${data.username}</p>
						<p><strong>Email:</strong> ${data.email}</p>
						<p><strong>Biografia:</strong> Esta é uma breve biografia sobre o user. Pode-se adicionar mais informações aqui, como os interesses, hobbies, ou qualquer outra coisa que for interessante compartilhar. Os campos podem ter outros nomes</p>
						<p><strong>Localização:</strong> Cidade, País</p>
					</div>
				</div>
			</div>
		</div>` ;
}

function makeEditProfilePage(data) {
	return `
	<div class="d-flex flex-column vh-100" id="reg">
		<nav class="navbar navbar-expand-xxl navbar-dark p-4" id="navBar">
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
								<a class="nav-link" href="" id="gameLink" data-value="game">Games</a>
							</li>
						</ul>
						<form id="search-form" class="d-flex ms-auto me-3" role="search">
							<input id="search-input" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
							<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
						</form>
						<ul class="navbar-nav flex-row mt-3 mt-xxl-0">
							<li class="nav-item">
								<button id="logOut" class="btn btn-primary w-100" type="button">logout</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			<div class="container profile-container my-6">
				<div class="row">
					<div class="col-lg-3 text-center">
						<div class="customTooltip">
							<a href="">
								<img src="/assets/avatar.png" alt="Profile Picture" class="profile-pic">		
							</a>
							<span class="customTooltiptext">change your photo</span>
						</div>
						<div class="d-grid mt-5 mx-auto">
							<button id="deleteEdit" class="btn btn-outline-danger" type="button">delete profile</button>
						</div>
					</div>
					<div class="col-lg-4 mt-5 profile-info">
						<h1>Seu Nome</h1>
						<div class="mb-3">
							<label for="username" class="form-label">Example label</label>
							<input type="text" class="form-control" id="username" placeholder="${data.username}">
						</div>
						<div class="mb-3">
							<label for="email" class="form-label">Another label</label>
							<input type="text" class="form-control" id="email" placeholder="${data.email}">
						</div>
						<div class="mb-3">
							<label for="formGroupExampleInput" class="form-label">Example label</label>
							<input type="text" class="form-control" id="formGroupExampleInput" placeholder="Example input placeholder">
						</div>
						<div class="mb-3">
							<label for="formGroupExampleInput2" class="form-label">Another label</label>
							<input type="text" class="form-control" id="formGroupExampleInput2" placeholder="Another input placeholder">
						</div>
						<div class="d-grid mt-5 gap-2 d-md-block">
							<button id="cancelEdit" class="btn btn-secondary" type="button">cancel</button>
							<button class="btn btn-success" type="button">save</button>
						</div>
					</div>
				</div>
			</div>
		<\div>
		`
}

// Função não utilizada
function makeProfilePageSearch(data) {
	return `
		<div class="d-flex flex-column vh-100" id="reg">
			<nav class="navbar navbar-expand-xxl navbar-dark" id="navBar">
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
								<a class="nav-link" href="" id="gameLink" data-value="game">Games</a>
							</li>
						</ul>
						<form id="search-form" class="d-flex ms-auto me-3" role="search">
							<input id="search-input" class="form-control me-2" type="search" placeholder="Search"
								aria-label="Search">
							<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
						</form>
						<ul class="navbar-nav flex-row mt-3 mt-xxl-0">
							<li class="nav-item">
								<button id="logOut" class="btn btn-primary w-100" type="button">logout</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			<div class="container profile-container my-6">
				<div class="row">
					<div class="col-lg-3 text-center">
						<div class="customTooltip">
							<a href="">
								<img src="/assets/ialves-m.jpg" alt="Profile Picture" class="profile-pic">
							</a>
							<span class="customTooltiptext">change your photo</span>
						</div>
						<div id="editProfile" class="d-grid mt-5 mx-auto">
							<button class="btn btn-secondary" type="button">send message</button>
						</div>
					</div>
					<div class="col-lg-9 mt-5 profile-info">
						<h1>${data.username}</h1>
						<p><strong>Username:</strong> ${data.username}</p>
						<p><strong>Email:</strong> ${data.email}</p>
						<p><strong>Biografia:</strong> Esta é uma breve biografia sobre o user. Pode-se adicionar mais informações aqui, como os interesses, hobbies, ou qualquer outra coisa que for interessante compartilhar. Os campos podem ter outros nomes</p>
						<p><strong>Localização:</strong>Cidade, País</p>
					</div>
				</div>
			</div>
		</div>` ;
}


function makeProfilePageSearchOther(data) {
	return `
		<div class="d-flex flex-column vh-100" id="reg">
			<nav class="navbar navbar-expand-xxl navbar-dark p-4" id="navBar">
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
								<a class="nav-link" href="" id="gameLink" data-value="game">Games</a>
							</li>
						</ul>
						<form id="search-form" class="d-flex ms-auto me-3" role="search">
							<input id="search-input" class="form-control me-2" type="search" placeholder="Search"
								aria-label="Search">
							<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
						</form>
						<ul class="navbar-nav flex-row mt-3 mt-xxl-0">
							<li class="nav-item me-3">
								<button id="back-profile" class="btn btn-outline-secondary w-100" type="button">myprofile</button>
							</li>
							<li class="nav-item">
								<button id="logOut" class="btn btn-primary w-100" type="button">logout</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			<div class="container profile-container my-6">
				<div class="row">
					<div class="col-lg-3 text-center">
						<div>
							<a href="">
								<img src="/assets/avatar.png" alt="Profile Picture" class="profile-pic">
							</a>
						</div>
						<div id="editProfile" class="d-grid mt-5 mx-auto">
							<button class="btn btn-secondary" type="button">send message</button>
						</div>
					</div>
					<div class="col-lg-9 mt-5 profile-info">
						<h1>${data.username}</h1>
						<p><strong>Username:</strong> ${data.username}</p>
						<p><strong>Email:</strong> ${data.email}</p>
						<p><strong>Biografia:</strong> Esta é uma breve biografia sobre o user. Pode-se adicionar mais informações aqui, como os interesses, hobbies, ou qualquer outra coisa que for interessante compartilhar. Os campos podem ter outros nomes</p>
						<p><strong>Localização:</strong> Cidade, País</p>
					</div>
				</div>
			</div>
		</div>` ;
}


function noResultsPage(searchValue) {
	return `
		<div class="d-flex flex-column vh-100" id="reg">
			<nav class="navbar navbar-expand-xxl navbar-dark" id="navBar">
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
								<a class="nav-link" href="" id="gameLink" data-value="game">Games</a>
							</li>
						</ul>
						<form id="search-form" class="d-flex ms-auto me-3" role="search">
							<input id="search-input" class="form-control me-2" type="search" placeholder="Search"
								aria-label="Search">
							<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
						</form>
						<ul class="navbar-nav flex-row mt-3 mt-xxl-0">
							<li class="nav-item">
								<button id="logOut" class="btn btn-primary w-100" type="button">logout</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			<div class="container profile-container my-6">
				<div class="row">
					<div class="col-lg-9 mt-5 profile-info">
						<h2><strong>no results for: ${searchValue}</h2>
					</div>
					<button id="backButton" class="btn btn-outline-secondary" type="button">back</button>
				</div>
			</div>
		</div>` ;
}

export { makeProfilePage, makeEditProfilePage, makeProfilePageSearchOther, noResultsPage }