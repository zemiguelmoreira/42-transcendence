
function createNavbar1() {
	return `
	<nav class="navbar navbar-expand-xxl navbar-dark" id="navBar">
  <div class="container-fluid me-auto">
    <a class="navbar-brand" href="">Transcendence</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNavDropdown">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" aria-current="page" href="" data-value="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="" id="list-users" data-value="/profile/">List users</a>
        </li>
		<li class="nav-item">
          <a class="nav-link" href="" data-value="">About</a>
        </li>
      </ul>
      <form class="d-flex">
        <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
        <button class="btn btn-outline-light" type="submit">Search</button>
      </form>
      <ul class="navbar-nav ms-auto">
        <li>
          <a class="nav-link active">Already have an account?</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" data-bs-display="static" href="" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" data-value="">
            <b>Login</b>
          </a>
          <div id="areaDrop" class="dropdown-menu dropdown-menu-dark dropdown-menu-lg-end" style="width: 300px;">
				<form class="px-4 py-3" id="userForm"> 
					<!-- Email input -->
					<div class="form-outline mb-4" data-mdb-input-init  >
					<input type="text" id="form1Example1" class="form-control" name="username"/>
					<label class="form-label" for="form1Example1">username</label>
					</div>

					<!-- Password input -->
					<div class="form-outline mb-4" data-mdb-input-init>
					<input type="password" id="form1Example2" class="form-control" name="password"/>
					<label class="form-label" for="form1Example2">Password</label>
					</div>

					<!-- 2 column grid layout for inline styling -->
					<div class="row mb-4">
					<div class="col">
						<!-- Simple link -->
						<a href="#!">Forgot password?</a>
					</div>
					</div>

					<!-- Submit button -->
					<div class="row mb-4">
					 <button type="submit" id="signIn" class="btn btn-primary btn-block" data-mdb-ripple-init data-value="/users/profile/login">Sign in</button>
					</div>
					<div class="row">
						<!-- Submit button 42-->
						<button type="submit" class="btn btn-primary btn-block" data-mdb-ripple-init>Sign in with 42</button>
					</div>
				</form>
				<div class="dropdown-divider"></div>
				<a id="register" class="dropdown-item" href="">New around here? Sign up</a>
				<a class="dropdown-item" href="" data-value="/sections/login">Forgot password?</a>
			</div>
        </li>
      </ul>
    </div>
  </div>
</nav>`;
}

var navbar2 = createNavbar1();


function createNavbar2 () {
	return `<nav class="navbar navbar-dark">
	<div class="container-fluid">
	  <a class="navbar-brand" href="">Transcendence</a>
	</div>
</nav>`;
}

const navbar3 = createNavbar2();

export { navbar2, navbar3 }