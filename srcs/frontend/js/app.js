import { createNavBarLoggedIn, createNavBarLoggedOut } from "./navbars.js";
import { viewToken } from "./utils/session.js";

function handlerNavbarButtons() {
    const signInBtn = document.getElementById('signInNavBtn');
    if (signInBtn) {
        signInBtn.addEventListener('click', function() {
            loadPage('login'); // Aqui deve ser 'login' em vez de 'signin' para corresponder à rota definida
        });
    }

    const signUpBtn = document.getElementById('signUpNavBtn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', function() {
            loadPage('register');
        });
    }

    const profileBtn = document.getElementById('my-profile');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Impede o comportamento padrão do link ou botão
            loadPage('profile');
        });
    }
}

function isLoggedIn() {
    const token = viewToken();
    return token ? true : false;
}

function generateNavBar() {
    const navbarLoggedOut = document.getElementById('navbar-logged-out');
    const navbarLoggedIn = document.getElementById('navbar-logged-in');

    navbarLoggedOut.innerHTML = createNavBarLoggedOut();
    navbarLoggedIn.innerHTML = createNavBarLoggedIn();

    if (isLoggedIn()) {
        navbarLoggedOut.style.display = 'none';
        navbarLoggedIn.style.display = 'block';
    } else {
        navbarLoggedOut.style.display = 'block';
        navbarLoggedIn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    generateNavBar();

    const root = document.getElementById('root');
    const routes = {
        login: {
            html: 'pages/login.html',
            js: 'js/login.js',
            auth: false, // Página não requer autenticação
            redirectIfAuth: true // Redireciona se o usuário estiver autenticado
        },
        register: {
            html: 'pages/register.html',
            js: 'js/register.js',
            auth: false, // Página não requer autenticação
            redirectIfAuth: true // Redireciona se o usuário estiver autenticado
        },
        profile: {
            html: 'pages/profile.html',
            js: 'js/profile.js',
            auth: true // Página requer autenticação
        },
        home: {
            html: 'pages/home.html',
            js: 'js/home.js',
            auth: true // Página requer autenticação
        },
    };

    const loadPage = async (page, addToHistory = true) => {
        if (!routes[page]) {
            console.error(`Page "${page}" not found`);
            return;
        }

        if (routes[page].auth && !isLoggedIn()) {
            console.log(`Access denied to page: ${page}`);
            page = 'login'; // Redireciona para a página de login se não estiver autenticado
        }

        if (routes[page].redirectIfAuth && isLoggedIn()) {
            console.log(`Redirecting authenticated user away from page: ${page}`);
            page = 'home'; // Redireciona para a página inicial se estiver autenticado
        }

        try {
            const response = await fetch(routes[page].html);
            const html = await response.text();
            root.innerHTML = html;

            const script = document.createElement('script');
            script.type = 'module';
            script.src = routes[page].js;
            script.onload = () => {
                console.log(`${page} script loaded`);
            };
            document.body.appendChild(script);

            if (addToHistory) {
                window.history.pushState({ page: page }, '', page);
            }

            // Atualiza a barra de navegação após carregar a página
            generateNavBar();

            // Adiciona os event listeners após carregar a página
            handlerNavbarButtons();

        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
        }
    };

    window.addEventListener('popstate', (event) => {
        const page = event.state && event.state.page ? event.state.page : 'login';
        loadPage(page, false);
    });

    const path = window.location.pathname.replace('/', '');
    const initialPage = path ? path : 'login'; // define a página inicial
    loadPage(initialPage, false);

    window.loadPage = loadPage;
});
