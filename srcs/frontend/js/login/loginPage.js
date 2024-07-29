function makeSignInPage() {
	return `
	<div class="login-box">
		<!-- <div class="login-title">Sign In 2Play</div> -->
		<div class="login-middle-box">
			<div class="login-title">Sign In to Your Account</div>
			<div id="signInForm">
				<form class="login-form" id="userSignInForm">
					<!-- Username input -->
						<label class="font-custom" for="form1Example1">USERNAME</label>
						<input type="text" class="form-control button-size" id="form1Example1" name="username" placeholder="username or email" autofocus>
					<!-- Password input -->
						<label class="font-custom --bs-green" for="form1Example3">PASSWORD</label>
						<input type="password" class="form-control button-size" id="form1Example3" name="password" placeholder="password">
					<!-- Submit button -->
						<button type="submit" id="signInUser" class="btn btn-outline-success button-size">SIGN IN</button>
						<button type="submit" id="signInUser42" class="btn btn-outline-custom button-size">SIGN IN WITH 42</button>
						<p id="error-message" style="display: none; color: red;"></p>
				</form>

				<form id="qrCodeForm" style="display: none;">
					<div>
						<p id="qr-code" style="background-color: white;"></p>
					</div>
					<div id="codeDiv">
						<label for="code">enter 2FA code</label>
						<input type="text" name="qrCode" id="code" placeholder="enter 2FA code">
					</div>
					<div>
						<button type="submit" id="verifyQrCode" class="bbtn btn-outline-success button-size">verify code</button>
					</div>
					<div>
						<p id="error-message-code" style="display: none; color: red;"></p>
					</div>
				</form>
			</div>
		</div>
	</div>
	<!-- <p id="user-list"></p> -->
	`;
}

const signIn_page = makeSignInPage();

export { signIn_page }