function makeRegisterPage() {
	return `
		<div class="welcome-message" id="welcome-box" style="display: block;">
			<div class="mainpage">
				<div class="welcome-message">
					<div class="login-title">Welcome to Transcendence</div>
					<div class="text-title-box">Enjoy this experience created by</div>
					
					<div class="mainpage-box">
						<div class="first-row">
							<div class="first-row-col">
								<div>@nmoreira</div>
								<div>@hmaciel-</div>
								<div>@ialves-m</div>
							</div>
							<div class="first-row-col">
								<div>@joaoalme</div>
								<div>@jdias-mo</div>
							</div>
						</div>
						<div class="second-row">
							<div class="buttons-col">
								<button id="register" class="btn button-size mainpage-btn">REGISTER TO BEGIN</button>
								<button id="login" class="btn button-size mainpage-btn">LOGIN ACCOUNT</button>
							</div>
						</div>
					</div>
					
				</div>
			</div>
		</div>
		<div id="reg" style="display: none; height: 100%;">
			<div class="login-box">
				<div class="login-title" id="home">CREATE ACCOUNT</div>
				<div class="login-middle-box">
					<div class="" id="registerForm">
						<form class="login-form" id="userRegisterForm">
							<!-- Username input -->
							<input type="text" style="display: none;" autocomplete="off">
							<label class="font-custom" for="form1Example1">USERNAME</label>
							<input type="text" class="form-control button-size" id="form1Example1" name="username"
								placeholder="Username" maxlength="8" autocomplete="off">
							<small id="limitChar" class="form-text text-white mt-0"
								style="display: none; text-align: left;">Maximum of 8 characters.</small>
							<!-- Email input -->
							<label class="font-custom" for="form1Example2">EMAIL</label>
							<input type="email" class="form-control button-size" id="form1Example2" name="email"
								placeholder="Email">
							<!-- Password input -->
							<div class="mb-3 position-relative">
						<label class="font-custom" for="form1Example3">PASSWORD</label>
								<input type="password" class="form-control button-size" id="form1Example3" maxlength="20" name="password" placeholder="Password" style="padding-right: 40px;">
						<i class="bi bi-eye position-absolute" id="togglePassword" style="right: 10px; top: 50%; transform: translateY(40%); cursor: pointer; color: black"></i>
					</div>
							<!-- Confirm Password input -->
					<div class="mb-3 position-relative">
						<label class="font-custom" for="form1Example4">CONFIRM PASSWORD</label>
						<input type="password" class="form-control button-size" id="form1Example4" maxlength="20" name="password2" placeholder="Confirm password">
						<i class="bi bi-eye position-absolute" id="togglePassword1" style="right: 10px; top: 50%; transform: translateY(40%); cursor: pointer; color: black"></i>
					</div>
							<!-- Submit button -->
							<button type="submit" id="signUp" class="btn btn-outline-custom button-size">SIGN
								UP</button>
							<label class="font-custom">OR</label>
							<a id="signIn" class="btn btn-outline-success button-size" href="">SIGN IN</a>
							<p id="error-message" style="display: none; color: red;"></p>
						</form>
						<form id="emailCodeForm" style="display: none;">
							<p class="" id="email-code"></p>
							<div class="form-group">
								<label class="font-custom" for="emailCode">Email Code</label>
								<input class="form-control button-size w-100" type="text" name="code" id="emailCode"
									placeholder="enter email code here" maxlength="6">
								<small id="limitChar1" class="form-text text-white mt-0"
									style="display: none; text-align: left;">Maximum of 6 characters.</small>
							</div>
							<button type="submit" id="verifyEmailCode"
								class="btn btn-outline-success button-size">verify code</button>
							<p id="error-message-emailCode" style="display: none; color: red;"></p>
						</form>
						<form id="requestPasswordResetForm" style="display: none;">
							<div class="login-title">PASSWORD RECOVER</div>
							<input class="form-control button-size" type="email" id="resetEmail"
								placeholder="Insert your email here" required>
							<button class="btn btn-outline-success button-size" type="button"
								onclick="requestPasswordReset()">REQUEST PASSWORD</button>
						</form>
					</div>
				</div>
				<p id="user-list"></p>
			</div>
		</div>
	`;
}

const register_page = makeRegisterPage();

export { register_page }