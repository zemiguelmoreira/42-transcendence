import asyncio

class MatchmakingManager:
	def __init__(self):
		self.pong_queue = {}
		self.snake_queue = {}

	async def add_player(self, username, game, rank):
		queue = await self._get_queue(game)
		queue[username] = rank

		match = await self.find_match(username, game, rank)

		if match:
			return match
		return await self.wait_for_match(username, game, rank)

	async def find_match(self, username, game, rank, tolerance=0):
		queue = await self._get_queue(game)

		# finding a match within tolerance
		match = None
		for other_player, other_rank in queue.items():
			if other_player != username and abs(rank - other_rank) <= tolerance:
				match = (other_player, other_rank)
				break

		# remove from queue
		if match:
			other_player, other_rank = match
			self.remove_player(username, game)
			self.remove_player(other_player, game)

			# order by rank if different otherwise by username (lower rank first to host game)
			if rank == other_rank:
				return tuple(sorted([username, other_player]))
			else:
				return (username, other_player) if rank < other_rank else (other_player, username)

		return None


	async def wait_for_match(self, username, game, rank, step=1):
		for tolerance in range(1, 50, step):  # increase tolerance by 'step' each iteration
			await asyncio.sleep(tolerance)  # wait for 'step' seconds
			match = await self.find_match(username, game, rank, tolerance=tolerance)
			if match:
				return match
		return None

	async def remove_player(self, username, game):
		queue = await self._get_queue(game)
		if username in queue:
			queue.pop(username)

	async def _get_queue(self, game):
		if game == "pong":
			return self.pong_queue
		elif game == "snake":
			return self.snake_queue
		else:
			raise ValueError(f"Unknown game: {game}")

# single instance
matchmaking_manager = MatchmakingManager()
