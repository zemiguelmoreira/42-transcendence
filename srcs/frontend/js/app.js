
import { viewToken } from "./authentication_utils/session.js";
import { createNavbarNotLogged, createNavbarLogged } from './html/navbar.js';
import { logout } from "./authentication_utils/logout.js";


function handlerNavbarButtons() {
    const signInBtn = document.getElementById('signInNavBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', function() {
            loadPage('signin');
        });
    }

    const signUpBtn = document.getElementById('signUpNavBtn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', function() {
            loadPage('signup');
        });
    }

    const logoutBtn = document.getElementById('logoutNavBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function loadPage(pageName) {
    fetch(`js/pages/${pageName}/${pageName}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('root').innerHTML = html;
            loadScript(`js/pages/${pageName}/${pageName}.js`);
        })
        .catch(error => console.error('Error loading page: ', error));
}

function loadScript(scriptName) {
    var scriptElement = document.createElement('script');
    scriptElement.src = scriptName;
    scriptElement.type = 'module';  // Adiciona o tipo "module" ao script
    document.body.appendChild(scriptElement);
}

function isLoggedIn() {
    
    const token = viewToken();

    console.log(token);
    return (token)
}

function generateNavBar(is_logged_in) {

    document.getElementById('navbar-logged-out').innerHTML = createNavbarNotLogged();
    document.getElementById('navbar-logged-in').innerHTML = createNavbarLogged();

    if (is_logged_in) {
        document.getElementById('navbar-logged-out').style.display = 'none';
        document.getElementById('navbar-logged-in').style.display = 'block';
    } else {
        document.getElementById('navbar-logged-out').style.display = 'block';
        document.getElementById('navbar-logged-in').style.display = 'none';
    }
}

generateNavBar(isLoggedIn());
document.addEventListener('DOMContentLoaded', function() {
    handlerNavbarButtons();
});

window.loadPage = loadPage;
window.isLoggedIn = isLoggedIn;
