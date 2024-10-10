class PongGame:
	canvasHeight = 560
	canvasWidth = 960
	PADDLE_WIDTH = 20
	PADDLE_HEIGHT = 90
	BALL_SIZE = 10
	FINAL_SCORE = 10

	paddles_init_y = 310 - 62
	paddle1_init_x = 0
	paddle2_init_x = canvasWidth - PADDLE_WIDTH

	ball_init_x = canvasWidth / 2 - BALL_SIZE / 2
	ball_init_y = canvasHeight / 2 - BALL_SIZE / 2

	game_tasks = {}
	# adiciona ao room
	def addToRoom:

	# cria thread p game e gravas tasks por room
	def start_game:


	def game_loop:
		


	def is_goal_paddle1(ball_x):
		return ball_x + BALL_SIZE >= canvasWidth

	def is_goal_paddle2(ball_x):
		return ball_x <= 0

	def is_collision_paddle1(ball_x, ball_y, paddle_y):
		return (ball_x <= PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)


	def is_collision_paddle2(ball_x, ball_y, paddle_y):
		return (ball_x + BALL_SIZE >= canvasWidth - PADDLE_WIDTH and ball_y + BALL_SIZE >= paddle_y and ball_y <= paddle_y + PADDLE_HEIGHT)

