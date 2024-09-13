import asyncio

class MatchmakingManager:
	def __init__(self):
		self.pong_queue = {}
		self.snake_queue = {}

	async def add_player(self, username, game, rank):
		queue = self._get_queue(game)
		queue[username] = rank

		match = await self.find_match(username, game, rank)

		if match:
			return match
		return await self.wait_for_match(username, game, rank)

	async def find_match(self, username, game, rank, tolerance=1):
		queue = self._get_queue(game)

		# if theres a match within rank tolerance
		for other_player, other_rank in queue.items():
			if other_player != username and abs(rank - other_rank) <= tolerance:
				# remove from queue both players
				self.remove_player(username, game)
				self.remove_player(other_player, game)
				return (username, other_player)
		return None

	async def wait_for_match(self, username, game, rank, step=1):
		for tolerance in range(2, 1000, step):  # increase tolerance by 'step' each iteration
			await asyncio.sleep(step)  # wait for 'step' seconds
			match = await self.find_match(username, game, rank, tolerance=tolerance)
			if match:
				return match
		return None

	def remove_player(self, username, game):
		queue = self._get_queue(game)
		if username in queue:
			queue.pop(username)

	def _get_queue(self, game):
		if game == "pong":
			return self.pong_queue
		elif game == "snake":
			return self.snake_queue
		else:
			raise ValueError(f"Unknown game: {game}")

# single instance
matchmaking_manager = MatchmakingManager()
