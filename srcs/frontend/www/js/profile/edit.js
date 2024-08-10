
import { makeEditProfilePage } from "./profilePages.js";
import { removeToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { getUser } from "../search/search_user.js";
import { deleteProfile } from "./deleteAccount.js";
import { limparDivAll } from "../utils/utils1.js";


// Funções na página edit
function edit(data, username) {

	document.getElementById('mainContent').innerHTML = '';
	const editPageData = makeEditProfilePage(data.user);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', editPageData);

	document.getElementById('profile-img').addEventListener('click', function() {
		document.getElementById('choosePicture').click();
	  });
	  
	  document.getElementById('choosePicture').addEventListener('change', function(event) {
		const reader = new FileReader();
		
		reader.onload = function(e) {
		  document.getElementById('profile-img').src = e.target.result;
		};
		
		reader.readAsDataURL(event.target.files[0]);
	  });
	  
	// document.getElementById('home').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo(`/user/${username}`);
	// });

	// document.getElementById('logOut').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	removeToken();
	// 	navigateTo('/');
	// });

	// document.getElementById('cancelEdit').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo(`/user/${username}/profile`);
	// });

	// document.getElementById('search-form').addEventListener('submit', (e) => {
	// 	e.preventDefault();
	// 	getUser(username);
	// });

	// document.getElementById('search-btn').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	getUser(username);
	// });

	// document.getElementById('deleteEdit').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	console.log('username botaõ delete: ', username);
	// 	deleteProfile(username);
	// });
}


export { edit }