import { getCsrfToken } from "../utils/csrf.js";
import { userName } from "../login/login.js";
import { userNameReg } from "../login/register.js";
import { makeProfilePage, makeEditProfilePage } from "../html/profile_page.js";
import { deleteProfile } from "../profile/delete_account.js";
import { limparDivAll } from "../utils/utils1.js";
import { baseURL } from "../app.js";
import { homeLogin } from "../html/home.js";
import { getUser } from "../profile/search_user.js";
import { navigateTo } from "../app.js";


let userData;

// Obtem o user id do user que está login
async function getIdbyName(username) {
    // try {
        const csrfToken = await getCsrfToken(); // Obter o token CSRF
        const dados = { user: username };

        const response = await fetch(`${baseURL}/get-user-id/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Adicionando o Content-Type correto
                'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
                'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
            },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            // throw new Error('Failed to fetch user profile');
			return null;
        }
        const data = await response.json(); 
        // console.log("id: ");
        // console.log(data.id);
        return data.id;
    // } catch (error) {
    //     console.error('Error:', error);
    //     return "0";
    // };
}


async function getNamebyId(user_id) {
    try {
        const csrfToken = await getCsrfToken(); // Obter o token CSRF
        const dados = { id: user_id };

        const response = await fetch(`${baseURL}/get-user-username/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Adicionando o Content-Type correto
                'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
                'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
            },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json(); 
        // console.log("id: ");
        console.log(data);
        console.log(data.username);
        return data.username;
    } catch (error) {
        console.error('Error:', error);
        return null;
    };
}


async function getIdbyNameList(userName) {
    try {
        const csrfToken = await getCsrfToken(); // Obter o token CSRF
        const dados = { user: userName };

        const response = await fetch(`${baseURL}/get-user-id-list/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Adicionando o Content-Type correto
                'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
                'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
            },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json(); 
        // console.log("id: ");
        console.log("query: ", data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return "0";
    };
}


// voltar à pagina de profile após cancel - não usada

function goProfile(data) {

	limparDivAll('root');
	console.log(data);
	const profilePageData = makeProfilePage(data);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageData);
	homeLogin();
	searchBtn();
	searchUserForm();
	const logout = document.getElementById('logOut');
	logout.addEventListener('click', goHome);
	const editBtn = document.querySelector("#editProfile");
	editBtn.addEventListener('click', (e) => {
		e.preventDefault();
		editPageBtns(data)});
}


// Funções na página edit
function editPageBtns(data, username) {

	const editPageData = makeEditProfilePage(data);
	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', editPageData);
	// homeLogin();
	// searchUserForm();
	// searchBtn();

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	document.getElementById('cancelEdit').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/profile`);
	});

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});
	
	document.getElementById('deleteEdit').addEventListener('click', (e) => {
		e.preventDefault();
		deleteProfile(username);
	});

	// logout.addEventListener('click', goHome);
	// const cancelBtn = document.querySelector("#cancelEdit");
	// cancelBtn.addEventListener('click', (e) => { 
	// 	e.preventDefault();
	// 	goProfile(data)});
	
	// const deleteBtn = document.querySelector('#deleteEdit');
	// deleteBtn.addEventListener('click', deleteProfile);
}


function userDataPage(userData, username) {

	limparDivAll('root');
	const profilePageData = makeProfilePage(userData);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageData);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${userData.username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	document.querySelector("#editProfile").addEventListener('click', (e) => {
			e.preventDefault();
			navigateTo(`/user/${userData.username}/profile/edit`);
		});

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

}



// Obtém os dados do user que está login e faz a página
async function fetchUserProfile(username) {

	try {
		let curr_username;
		if (userName != "")
			curr_username = userName;
		else if( userNameReg != "")
			curr_username = userNameReg;
		
		const userId = await getIdbyName(username);
		const csrfToken = await getCsrfToken(); // Obter o token CSRF

		const response = await fetch(`${baseURL}/user-profile/${userId}/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
			}
		});

		if (!response.ok) {
			// throw new Error('Failed to fetch user profile');
			throw {
				message: 'Failed to fetch user profile',
				status: 401,
				status_msg: 'Internal Server Error - Tokens'
			};
		}

		userData = await response.json();
		console.log(userData);

		navigateTo(`/user/${username}/profile`);

	} catch (e) {
		// console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}


export { userData, getIdbyName, getIdbyNameList, goProfile, getNamebyId, fetchUserProfile, userDataPage, editPageBtns };