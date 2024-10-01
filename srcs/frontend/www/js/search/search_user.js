import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makeProfilePageSearchOther, noResultsPage } from "../profile/profilePages.js";
import { navigateTo } from "../app.js";
import { messageContainerToken , displaySlidingMessage } from "../utils/utils1.js";
import { addFriend , blockUser } from "../utils/manageUsers.js";

let dataUserSearch;
let dataUserFromSearch;

async function userSearchPage(dataUserSearch, username) {
	document.getElementById('mainContent').innerHTML = '';
	const profilePageDataSearch = makeProfilePageSearchOther(dataUserSearch);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageDataSearch);
	document.getElementById('addFriend').addEventListener('click', async (e) => {
		e.preventDefault();
		await addFriend(dataUserSearch.user.username, displaySlidingMessage);
	});
	document.getElementById('blockUser').addEventListener('click', async (e) => {
		e.preventDefault();
		await blockUser(dataUserSearch.user.username, displaySlidingMessage);
	});
}

function noResults(username, query) {
	document.getElementById('mainContent').innerHTML = '';
	const noResultsUserId = noResultsPage(query);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', noResultsUserId);
}

async function getUser(username) {
	
	try {

		let query;
		const searchInputElement = document.getElementById('search-input');
		query = searchInputElement.value;

		if (query) {

			searchInputElement.value = "";
			const user = await getUserProfileByUsername(query);
			console.log('Resposta no getUser: ', user);

			if (user.status && user.status === 404) {

				navigateTo(`/user/${username}/profile/search/noresults/${query}`);
				return;

			} else if (user.status && user.status === 401) {

				const messageDiv = messageContainerToken();
				document.getElementById('root').innerHTML = "";
				document.getElementById('root').insertAdjacentHTML('afterbegin', messageDiv);
				const messageContainer = document.getElementById('tokenMessage');
				messageContainer.style.display = 'block';
				setTimeout(function () {
					messageContainer.style.display = 'none';
					navigateTo(`/signIn`);
				}, 2000);
				return;

			} else if (user.status) {

				throw {
					status: user.status,
					message: user.statusText
				}

			}

			dataUserSearch = user;
			if (username === dataUserSearch.user.username) {
				dataUserFromSearch = user;
				navigateTo(`/user/${username}/profile`);
			} else {
				navigateTo(`/user/${username}/profile/search/${dataUserSearch.user.username}`);
			}

		}

	} catch (e) {
		console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}

async function viewUserProfile(username, searchUser) {
	
	try {
		let query = searchUser;
		const user = await getUserProfileByUsername(query);
		if (user.status && user.status === 404) {
			navigateTo(`/user/${username}/profile/search/noresults/${query}`);
			return;
		} else if (user.status && user.status === 401) {
			const messageDiv = messageContainerToken();
			document.getElementById('root').innerHTML = "";
			document.getElementById('root').insertAdjacentHTML('afterbegin', messageDiv);
			const messageContainer = document.getElementById('tokenMessage');
			messageContainer.style.display = 'block';
			setTimeout(function () {
				messageContainer.style.display = 'none';
				navigateTo(`/signIn`);
			}, 2000);
			return;
		} else if (user.status) {
			throw {
				status: user.status,
				message: user.statusText
			}
		}
		dataUserSearch = user;
		if (username === dataUserSearch.user.username) {
			dataUserFromSearch = user;
			navigateTo(`/user/${username}/profile`);
		} else {
			navigateTo(`/user/${username}/profile/search/${dataUserSearch.user.username}`);
		}
	} catch (e) {
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}

export { dataUserSearch, dataUserFromSearch, getUser, viewUserProfile, userSearchPage, noResults }