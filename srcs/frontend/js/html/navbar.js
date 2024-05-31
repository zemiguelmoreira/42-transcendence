


function createNavbar() {
	return `<nav class="navbar py-3 sticky-top navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
        <a class="navbar-brand" href="">My Site</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav">
                <a class="nav-link" href="" data-value="/">Home</a>
                <a class="nav-link" id="gameLink" href="" data-value="/sections/game">game</a>
                <a class="nav-link" href="" data-value="/sections/login">login</a>
            </div>
        </div>
    </div>
</nav>`
}

var navbar = createNavbar();

export { navbar }