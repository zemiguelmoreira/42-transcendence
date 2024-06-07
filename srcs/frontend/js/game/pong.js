let ctx, p1_y, p2_y, p1_points, p2_points
let ball_y_orientation, ball_x_orientation, ball_x, ball_y
let p1_key, p2_key
const h=500, w=800, p_w=20, p_h=200, p1_x = 10, p2_x = w - p_w - 10

let gameInterval;

function stopGame(){
    clearInterval(gameInterval); // Para o intervalo
}

// Após colocação do stopGame no home acho que esta função nãp é precisa
// function setupGame(){
//     const links = document.querySelectorAll(".nav-link");
// 	for(let link of links)
// 		{
// 			if (link.dataset.value !== "game")
// 				link.addEventListener('click', stopGame);
// 		}
// 	// const butSign = document.querySelector('#signIn');
// 	// butSign.addEventListener('click', stopGame);
// }

function setupGame(){
    const link = document.querySelector("#home");
	link.addEventListener('click', stopGame);
}

// function setupGame() {
//     const elements = document.querySelectorAll(":not([data-value='game'])");
//     for (let element of elements) {
//         element.addEventListener('click', stopGame);
//     }
// }

function start () {
	setup();
}

function start1 () {
	stopGame();
	setup();
}

function setup(){

    const canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    
    // inicializa as posições y do p1 e do p2 para metade da tela
    p1_y = p2_y = (h / 2) - (p_h/2)
    
    // inicializa os pontos dos jogadores como 0
    p1_points = 0
    p2_points = 0

    //define um intervalo de 60 fps para o loop
    gameInterval = setInterval(loop,1000/60)

    initBall()
}

function loop(){
    //Verifica se a bola está colidindo com o barra do player 1
    if(ball_x >= p1_x && ball_x <= p1_x + 10 && ball_y >= p1_y && ball_y <= p1_y + p_h){
        ball_x_orientation = 1
    }
    //Verifica se a bola está colidindo com o barra do player 2
    else if(ball_x >= p2_x && ball_x <= p2_x + 10 && ball_y >= p2_y && ball_y <= p2_y + p_h){
        ball_x_orientation = -1
    }

    // verifica se a bola passou bateu no chão ou no teto
    if(ball_y + 10 >= h || ball_y <= 0) ball_y_orientation *= -1

    //move a bola no eixo X e Y
    ball_x += 5 * ball_x_orientation
    ball_y += 5 * ball_y_orientation

    if(ball_x+10 > w) {
        p1_points++
        initBall()
    }
    else if(ball_x < 0){
        p2_points ++
        initBall()
    }

    if(p1_key == "KeyW" && p1_y > 0){

        p1_y -= 10
    }else if(p1_key == "KeyS" && p1_y + p_h < h){
        p1_y += 10
    }

    if(p2_key == "KeyO" && p2_y > 0){
        p2_y -= 10
    }else if(p2_key == "KeyL" && p2_y + p_h < h){
        p2_y += 10
    }
    draw()
}

function initBall(){
    console.log(`${p1_points} VS ${p2_points}`)
    ball_y_orientation = Math.pow(2, Math.floor( Math.random() * 2 )+1) - 3 
    ball_x_orientation = Math.pow(2, Math.floor( Math.random() * 2 )+1) - 3 
    ball_x = w / 2 -10
    ball_y = h / 2 -10
}

function draw(){
    // fundo

    drawRect(0,0,w,h,"#000")
    // player 1
    drawRect(p1_x, p1_y, p_w, p_h)
    // player 2
    drawRect(p2_x, p2_y, p_w, p_h)
    // barra lateral
    drawRect(w/2 -5,0,5,h)
    // bola
    drawRect(ball_x, ball_y, 10, 10)
    writePoints()
}

function drawRect(x,y,w,h,color="#fff"){
    ctx.fillStyle = color
    ctx.fillRect(x,y,w,h)
    ctx.fillStyle = "#000"
}

function writePoints(){
    ctx.font = "50px monospace";
    ctx.fillStyle = "#fff";
    // w/4 = 1/4 da tela = metade da tela do player 1
    ctx.fillText(p1_points, w/4, 50);
    // 3*(w/4) = 3/4 da tela = metade da tela do player 2
    ctx.fillText(p2_points, 3*(w/4), 50);
}

document.addEventListener("keydown",function(ev){
    // code 87 = w, code 83 = s
    // console.log(ev.code);
    if(ev.code == "KeyW" || ev.code == "KeyS"){
        p1_key = ev.code
    }
    // code 38 = arrowUp, code 40 = arrowDown
    else if(ev.code== "KeyO" || ev.code=="KeyL")
        p2_key = ev.code
})

// setup();

export { setup, setupGame, start, start1, stopGame };
