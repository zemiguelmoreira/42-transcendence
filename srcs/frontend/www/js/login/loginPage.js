function makeSignInPage() {
	return `
		<div class="login-box">
		<div class="login-title">LOGIN ACCOUNT</div>
			<div class="login-middle-box">
				<div class="login-form" id="signInForm">
	
					<form id="userSignInForm">
							<label class="font-custom --bs-green" for="form1Example1">USERNAME</label>
							<input type="text" class="form-control button-size" id="form1Example1" name="username" placeholder="username" maxlength="8">
							<small id="limitChar2" class="form-text text-white mt-0" style="display: none; text-align: left;">Maximum of 8 characters.</small>
							<!-- Password input -->
							<div class="mb-3 position-relative">
								<label class="font-custom --bs-green" for="form1Example3">PASSWORD</label>
								<input type="password" class="form-control button-size" id="form1Example3" name="password" placeholder="password">
								<i class="bi bi-eye position-absolute" id="togglePassword" style="right: 10px; top: 50%; transform: translateY(40%); cursor: pointer; color: black"></i>
							</div>
							<button type="submit" id="signInUser" class="btn btn-outline-success button-size">SIGN IN</button>
							<a href="" id="signInUser42" class="btn btn-outline-custom button-size">SIGNIN WITH 42</a>
							<a href="" id="recover" class="btn btn-outline-custom button-size">RECOVER PASSWORD</a>
							<button class="btn btn-outline-secondary button-size" id="backButton">GO BACK</button>
							<p id="error-message" style="display: none; color: red;"></p>
					</form>
	
					<form id="qrCodeForm" style="display: none;">
							<p class="qr-code-box" id="qr-code" style="background-color: white;"></p>
						<div id="codeDiv">
							<label class="font-custom" for="code">Two-Factor Authentication</label>
							<input  class="form-control button-size" type="text" name="qrCode" id="code" placeholder="Enter 2FA code here" maxlength="6">
							<small id="limitChar3" class="form-text text-white mt-0" style="display: none; text-align: left;">Maximum of 6 characters.</small>
						</div>
							<button type="submit" id="verifyQrCode" class="btn btn-outline-success button-size">verify code</button>
							<p id="error-message-code" style="display: none; color: red;"></p>
					</form>

					<form id="requestPasswordResetForm" style="display: none;">
						<div class="font-custom --bs-green">PASSWORD RECOVER</div>
						<input class="form-control button-size" type="email" id="resetEmail" placeholder="Insert your email here" required>
						<button class="btn btn-outline-success button-size" type="submit" id="sendPassword">REQUEST PASSWORD</button>
						<button class="btn btn-outline-secondary button-size" id="backToSignIn">GO BACK</button>
						<p id="error-message-password" style="display: none; color: red;"></p>
					</form>

				</div>
			</div>
		</div>
	`;
}

const signIn_page = makeSignInPage();

export { signIn_page }