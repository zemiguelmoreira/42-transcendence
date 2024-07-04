

//  botões do navegador

window.addEventListener('popstate', (event) => {
	if (event.state) {
		history.replaceState({ url: event.state.url }, '', event.state.url);
		const page = pages[event.state.url];
		if (!page)
			return;
		page.loadContent();
	}
	else {
		history.replaceState({ url: '/' }, '', '/');
		const page = pages[event.state.url];
		if (!page)
			return;
		page.loadContent();
	}
});


//  botões próprios

function changePage(page)
	{
		if (!page)
			return;
		 console.log('Changing page to', page.url);
		if (page.loadContent()) {
			currentPage = page;
			history.pushState({ url: page.url }, '', page.url);
		}
		else{
			console.log('Failed to load content for', page.url);

		}
	}