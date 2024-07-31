function makeRegisterPage() {
	return `
	<div class="login-box" id="reg">
		<div class="login-title" id="home">Create Account</div>
		<div class="login-middle-box">
			<div class="" id="registerForm">
				<form class="login-form" id="userRegisterForm">
					<!-- Username input -->
					<label class="font-custom" for="form1Example1">USERNAME</label>
					<input type="text" class="form-control button-size" id="form1Example1" name="username" placeholder="Username">
					<!-- Email input -->
					<label class="font-custom" for="form1Example2">EMAIL</label>
					<input type="email" class="form-control button-size" id="form1Example2" name="email" placeholder="Email">
					<!-- Password input -->
					<label class="font-custom" for="form1Example3">PASSWORD</label>
					<input type="password" class="form-control button-size" id="form1Example3" name="password" placeholder="Password">
					<!-- Confirm Password input -->
					<label class="font-custom" for="form1Example4">CONFIRM PASSWORD</label>
					<input type="password" class="form-control button-size" id="form1Example4" name="password2" placeholder="Confirm password">
					<!-- Submit button -->
					<button type="submit" id="signUp" class="btn btn-outline-custom button-size">SIGN UP</button>
					<label class="font-custom" >OR</label>
					<a id="signIn" class="btn btn-outline-success button-size" href="">SIGN IN</a>
					<p id="error-message" style="display: none; color: red;"></p>
				</form>
			</div>
		</div>
		<p id="user-list"></p>
	</div>
	`;
}

const register_page = makeRegisterPage();

export { register_page }