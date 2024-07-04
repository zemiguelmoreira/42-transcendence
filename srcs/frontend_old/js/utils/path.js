
import { home, homeLogin } from "../html/home.js";
import { register } from "../login/register.js";
import { userDataPage, userData, editPageBtns } from "../profile/myprofile.js";
import { dataUserSearch, userSearchPage, noResults } from "../profile/search_user.js";
import { navigateTo } from "../app.js";
import { viewToken } from "../login/session.js";
import { signIn } from "../login/login.js";
import { displayPageError } from "../html/error_page.js";



const pages = {
    '/': {
        loadContent: function () {
            home();          
        }
    },
    '/signIn': {
        loadContent: function() {
            console.log('Loading signIn page content');
            signIn();
        }
    },
    '/register': {
        loadContent: function() {
            console.log('Loading register page content');
            register();
        }
    },
    '/user/:username': {
        loadContent: function(params) {
            console.log('Loading user login page content for', params.username);
			if (viewToken())
            	homeLogin(params.username);
			else
				// navigateTo('/signIn');
                navigateTo('/', true);
        }
    },
    '/error/:status/:message': {
        loadContent: function(params) {
            console.log('Loading user error page content for', params.status, params.message);
            const makeError = displayPageError(params.status, params.message);
			document.getElementById('root').innerHTML = '';
			document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
			const home_error = document.getElementById('a_error');
			home_error.addEventListener('click', (e) => {
				e.preventDefault();
				navigateTo('/');
			})
        }
    },
	'/user/:username/profile': {
        loadContent: function(params) {
            console.log('Loading user profile page content for', params.username);
			// antes de entrar na rota verificar na função fetchuserprofile se o token é válido se não for vai para a home
            if(viewToken())
			    userDataPage(userData, params.username);
            else
                navigateTo('/', true);
        }
    },
	'/user/:username/profile/edit': {
        loadContent: function(params) {
            console.log('Loading user profile edit page content for', params.username);
			// antes de entrar na rota verificar na função fetchuserprofile se o token é válido se não for vai para a home
            if(viewToken())
			    editPageBtns(userData, params.username);
            else
                navigateTo('/', true);
        }
    },
	'/user/:username/profile/search/:user': {
        loadContent: function(params) {
            console.log('Loading user profile search user page content for', params.username);
			// antes de entrar na rota verificar na função fetchuserprofile se o token é válido se não for vai para a home
			if(viewToken())
                userSearchPage(dataUserSearch, params.username);
            else
                navigateTo('/', true);
        }
    },
	'/user/:username/profile/search/noresults/:query': {
        loadContent: function(params) {
            console.log('Loading user profile search user page-no results content for', params.username);
			// antes de entrar na rota verificar na função fetchuserprofile se o token é válido se não for vai para a home
            if(viewToken())
			    noResults(params.username, params.query);
            else
                navigateTo('/', true);
        }
    },
    // Outras páginas...
};


export { pages }