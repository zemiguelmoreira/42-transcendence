function makeSignInPage() {
	return `
	<div class="login-box">
		<div class="login-middle-box">
			<div class="login-title">Login Account</div>
			<div class="login-form" id="signInForm">
				<form id="userSignInForm">
						<label class="font-custom --bs-green" for="form1Example1">USERNAME</label>
						<input type="text" class="form-control button-size" id="form1Example1" name="username" placeholder="username or email" maxlength="20">
						<small id="limitChar2" class="form-text text-white mt-0" style="display: none; text-align: left;">Maximum of 20 characters.</small>
						<label class="font-custom --bs-green" for="form1Example3">PASSWORD</label>
						<input type="password" class="form-control button-size" id="form1Example3" name="password" placeholder="password">
						<button type="submit" id="signInUser" class="btn btn-outline-success button-size">SIGN IN</button>
						<p id="error-message" style="display: none; color: red;"></p>
						<button class="btn btn-outline-secondary button-size" id="backButton">GO BACK</button>
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
			</div>
		</div>
	</div>
	`;
}

const signIn_page = makeSignInPage();

export { signIn_page }