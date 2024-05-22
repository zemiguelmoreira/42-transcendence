

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




export { limparDiv, limparDivAll }