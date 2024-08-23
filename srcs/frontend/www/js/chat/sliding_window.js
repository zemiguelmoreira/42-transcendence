
document.getElementById('toggle-window-btn').addEventListener('click', function () {
	var slidingWindow = document.querySelector('.sliding-window');
	if (slidingWindow.classList.contains('closed')) {
		slidingWindow.classList.remove('closed');
		slidingWindow.classList.add('open');
		this.src = '../../files/arrow-left-square-fill.svg'; // Altere para o ícone de fechar se necessário
	} else {
		slidingWindow.classList.remove('open');
		slidingWindow.classList.add('closed');
		this.src = '../../files/arrow-right-square-fill.svg'; // Altere para o ícone de abrir se necessário
	}
});
