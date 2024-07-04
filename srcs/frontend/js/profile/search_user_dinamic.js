import { getIdbyName, getIdbyNameList } from "./myprofile.js";
import { makeProfilePageSearchOther } from "../html/profile_page.js";
import { getCsrfToken } from "../utils/csrf.js";
import { baseURL } from "../app.js";
import { limparDivAll } from "../utils/utils1.js";
import { homeLogin, goHome } from "../html/home.js";




async function getUserDinamic(searchInput) {
	let usersID;
	let query = searchInput.value;
	const resultsDiv = document.getElementById('results');
	console.log('value: ', query);

	if (query) {
		usersID = await getIdbyNameList(query);
		console.log('users:', usersID);
	}

	if (query.length < 1) {
		resultsDiv.innerHTML = '';
		resultsDiv.classList.remove('show');
		return;
	}

	resultsDiv.innerHTML = ''; // Clear previous results
	if (usersID && usersID.length > 0) resultsDiv.classList.add('show');

	usersID.forEach(user => {
		const userDiv = document.createElement('div');
		userDiv.className = 'user';
		userDiv.textContent = `${user.username}`;
		userDiv.dataset.id = user.id;
        userDiv.dataset.username = user.username;
		userDiv.dataset.name = 'username';
		resultsDiv.appendChild(userDiv);
	});

	// Remove previous event listener to avoid multiple attachments
	// resultsDiv.removeEventListener('click', handleUserClick);

	resultsDiv.replaceWith(resultsDiv.cloneNode(true));
	const newResultsDiv = document.getElementById('results');

	// Attach event listener for user click
	newResultsDiv.addEventListener('click', handleUserClick);

	// Function to handle user click
	function handleUserClick(e) {
		if (e.target && e.target.matches('.user')) {
			const userDiv = e.target;
			searchInput.value = userDiv.dataset.username;
			resultsDiv.innerHTML = '';
			resultsDiv.classList.remove('show');
		}
	}

	const formsearch = document.getElementById('search-form');

	// Remove previous submit event listener to avoid multiple attachments
	// formsearch.removeEventListener('submit', handleFormSubmit);

	// Attach event listener for form submit
	formsearch.addEventListener('submit', handleFormSubmit);

	// Function to handle form submit
	async function handleFormSubmit(e) {

		e.preventDefault();

		const selectedUser = searchInput.value;
		// console.log(selectedUser);

		if (selectedUser) {
			try {
				const csrfToken = await getCsrfToken();
				const userID = await getIdbyName(selectedUser);

				if (!userID) return;

				const response = await fetch(`${baseURL}/user-profile/${userID}/`, {
					method: 'GET',
					headers: {
						'X-CSRFToken': csrfToken  // Include CSRF token in the request headers
					}
				});

				if (!response.ok) {
					throw new Error('Failed to fetch user profile');
				}

				const data = await response.json();
				limparDivAll('root');
				const profilePageDataSearch = makeProfilePageSearchOther(data);
				document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageDataSearch);
				homeLogin();
				const logout = document.getElementById('logOut');
				logout.addEventListener('click', goHome);
			} catch (error) {
				console.error('Error:', error);
			}
		}
	}
}


function searchUserForm() {

	try {

		const searchInput = document.getElementById('search-input');

		searchInput.addEventListener('input', (e) => {
			e.preventDefault();
			getUserDinamic(searchInput);
		});

	} catch (error) {
		console.error('Error:', error);
	}

}

export { searchUserForm }