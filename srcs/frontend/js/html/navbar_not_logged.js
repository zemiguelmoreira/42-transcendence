
function createNavbarNotLogged() {
	return `<div class="container">
    <a class="navbar-brand" href="">Transcendence</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNavDropdown">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="">Game</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">About</a>
        </li>
      </ul>
      <form class="d-flex">
        <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
        <button class="btn btn-outline-light" type="submit">Search</button>
      </form>
      <ul class="navbar-nav ms-auto">
        <li>
          <a class="nav-link">Already have an account?</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <b>Login</b>
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
            <li>
              <div class="row">
                <div class="col-12">
                  Login via
                  <div class="social-buttons">
                    <a href="#" class="btn btn-primary"><i class="bi bi-facebook"></i>42</a>
                  </div>
                  or
                  <form class="form" role="form" method="post" action="login" accept-charset="UTF-8" id="login-nav">
                    <div class="mb-3">
                      <label for="exampleInputEmail2" class="form-label">Email address</label>
                      <input type="email" class="form-control" id="exampleInputEmail2" aria-describedby="emailHelp" placeholder="Email address" required>
                    </div>
                    <div class="mb-3">
                      <label for="exampleInputPassword2" class="form-label">Password</label>
                      <input type="password" class="form-control" id="exampleInputPassword2" placeholder="Password" required>
                      <div id="emailHelp" class="form-text"><a href="#">Forget the password?</a></div>
                    </div>
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="exampleCheck1">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Sign in</button>
                  </form>
                </div>
                <div class="bottom text-center">
                  New here? <a href="#"><b>Join Us</b></a>
                </div>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>`;
}

export { createNavbarNotLogged }