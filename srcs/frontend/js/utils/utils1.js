

function limparDiv(divId) {
    var div = document.getElementById(divId);
    if(div) {
        var children = div.childNodes;
        for(var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
			console.log(child.id);
            if(child.id !== "canvas" && child.id !== "navBar") {
                div.removeChild(child);
            }
        }
    } else {
        console.error("O elemento com o ID fornecido não foi encontrado.");
    }
}


function limparDivAll(divId) {
    var div = document.getElementById(divId);
    if(div) {
        var children = div.childNodes;
        for(var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
			console.log(child.id);
            div.removeChild(child);
        }
    } else {
        console.error("O elemento com o ID fornecido não foi encontrado.");
    }
}


function displayError(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.textContent = `${errorMessage}. Try again`;
	errorDiv.style.display = 'block'; // Mostra a div de erro
	const registerForm = document.querySelector('#userRegisterForm');
	for (let element of registerForm.elements) {
		if (element.classList.contains('form-control')) {
			element.addEventListener('input', function () {
				if (element.value) {
					errorDiv.style.display = 'none';
				}
			});
		}
	}
}



function displayErrorSignIn(errorMessage) {
	const errorDiv = document.getElementById('error-message');
	errorDiv.textContent = `${errorMessage}. Try again`;
	errorDiv.style.display = 'block'; // Mostra a div de erro
	const registerForm = document.querySelector('#userSignInForm');
	console.log(registerForm);
	for (let element of registerForm.elements) {
		if (element.classList.contains('form-control')) {
			element.addEventListener('input', function () {
				if (element.value) {
					errorDiv.style.display = 'none';
				}
			});
		}
	}
}


export { limparDiv, limparDivAll, displayError, displayErrorSignIn }