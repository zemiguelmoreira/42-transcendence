import { makeProfilePage } from "./profilePages.js";

function userProfilePage(userData, username) {

	document.getElementById('mainContent').innerHTML = '';
	const profilePageData = makeProfilePage(userData.user);

	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageData);
}

export { userProfilePage }