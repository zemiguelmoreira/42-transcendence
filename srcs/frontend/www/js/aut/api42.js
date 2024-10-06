import { urlAuth } from "./auth.js";

// Select the button element and add a click event listener to trigger getCode function
const button = document.querySelector("#teste");
button.addEventListener('click', getCode);

// Redirects the user to the authentication URL when the button is clicked
function getCode() {
    window.location.href = urlAuth;
}

// Retrieves the 'code' parameter from the URL if it exists
function getParams() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    // 'code' is processed if it exists (currently empty block)
    if (code) {
        // Logic to handle 'code' can be added here
    }
}

// Call getParams to check for URL parameters when the script runs
getParams();
