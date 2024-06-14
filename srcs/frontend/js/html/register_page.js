

function makeRegisterPage() {
	return `
	<div class="d-flex flex-column vh-100" id="reg">
	<nav class="navbar navbar-dark">
  		<div class="container-fluid">
    		<a class="navbar-brand" href="" id="home">Transcendence</a>
  		</div>
	</nav>
	<div class="container my-5">
	<h2 class="px-4 d-flex justify-content-center mb-3">SignUP 2Play</h2>
    <div class="row d-flex justify-content-center">
      <div class="col-4 rounded-3" id="registerForm">
        <form class="px-4 py-3" id="userRegisterForm"> 
          <!-- Username input -->
          <div class="form-group mb-3">
            <label for="form1Example1">username</label>
            <input type="text" class="form-control" id="form1Example1" name="username" placeholder="username">
          </div>
		  <!-- Email input -->
          <div class="form-group mb-3">
            <label for="form1Example2">email</label>
            <input type="email" class="form-control" id="form1Example2" name="email" placeholder="email">
          </div>
          <!-- Password input -->
          <div class="form-group mb-3">
            <label for="form1Example3">password</label>
            <input type="password" class="form-control" id="form1Example3" name="password" placeholder="Password">
          </div>
		  <!-- Confirm Password input -->
          <div class="form-group mb-5">
            <label for="form1Example4">confirm password</label>
            <input type="password" class="form-control" id="form1Example4" name="password2" placeholder="confirm password">
          </div>
          <!-- Submit button -->
		  <div class="d-grid gap-2 col-6 mx-auto">
          <button type="submit" id="signUp" class="btn btn-primary btn-block" data-value="/profile/create/">sign up</button>
		  </div>
		  <div class="mt-5 d-flex justify-content-center">
		  	<a id="signInRegister" class="link-opacity-25-hover link-underline link-underline-opacity-0" href="">sign in</a>
		  </div>
		  <div class="mt-3 d-flex justify-content-center">
		  	<p id="error-message" style="display: none; color: red;"></p>
		  </div>
        </form>
      </div>
    </div>
	</div>
	<p id="user-list"></p>
	</div>`;
	
}

const register_page = makeRegisterPage();

export { register_page }