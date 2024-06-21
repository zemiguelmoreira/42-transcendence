
function makeSignInPage() {
	return `
	<nav class="navbar navbar-dark">
  		<div class="container-fluid">
    		<a class="navbar-brand" href="" id="home">Transcendence</a>
  		</div>
	</nav>
	<div class="container my-5">
	<h2 class="px-4 d-flex justify-content-center mb-4">Sign In 2Play</h2>
    <div class="row d-flex justify-content-center">
      <div class="col-3 rounded-3" id="signInForm">
        <form class="px-4 py-3" id="userSignInForm"> 
          <!-- Username input -->
          <div class="form-group mb-3">
            <label for="form1Example1">username</label>
            <input type="text" class="form-control" id="form1Example1" name="username" placeholder="username or email" autofocus>
          </div>
          <!-- Password input -->
          <div class="form-group mb-5">
            <label for="form1Example3">password</label>
            <input type="password" class="form-control" id="form1Example3" name="password" placeholder="password">
          </div>
          <!-- Submit button -->
		  <div class="d-grid gap-2 col-6 mx-auto w-100">
          	<button type="submit" id="signInUser" class="btn btn-primary btn-block" data-value="/profile/login/">sign in</button>
		  </div>
		  <div class="d-grid gap-2 col-6 mt-2 mx-auto w-100">
          	<button type="submit" id="signInUser42" class="btn btn-secondary btn-block" data-value="">sign in with 42</button>
		  </div>
		  <div class="mt-3 d-flex justify-content-center">
		  	<p id="error-message" style="display: none; color: red;"></p>
		  </div>
        </form>
      </div>
    </div>
	</div>
	<p id="user-list"></p>`;
}

const signIn_page = makeSignInPage();

export { signIn_page }