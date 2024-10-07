import asyncio
import redis
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

channel_layer = channels.layers.get_channel_layer()
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

class MatchmakingManager:
	def __init__(self):
		self.redis_client = redis_client

	async def add_player(self, username, game, rank):
		player_data = json.dumps({"username": username, "rank": rank})
		queue_key = f"queue:{game}"
		self.redis_client.rpush(queue_key, player_data)
		match = await self.find_match(username, game, rank)
		if match:
			await self.send_match(username, match, game)
		else:
			match = await self.wait_for_match(username, game, rank)
			await self.send_match(username, match, game)


	async def find_match(self, username, game, rank, tolerance=0):
		queue_key = f"queue:{game}"
		match = None
		# loop through queue list on redis
		queue_length = self.redis_client.llen(queue_key)
		for i in range(queue_length):
			player_data = self.redis_client.lindex(queue_key, i)
			player = json.loads(player_data)
			# check if i player is a match within tolerance
			if player["username"] != username and abs(rank - player["rank"]) <= tolerance:
				match = player
				break
		# if a match is found, remove both players from the queue
		if match:
			self.remove_player(username, game)
			self.remove_player(match["username"], game)
			# order players by rank or alphabetically if same rank
			if rank == match["rank"]:
				return sorted([{"username": username, "rank": rank}, match], key=lambda x: x["username"])
			else:
				return sorted([{"username": username, "rank": rank}, match], key=lambda x: x["rank"])
		return None


	async def wait_for_match(self, username, game, rank, step=1):
		for tolerance in range(1, 50, step):  # increase tolerance by 'step' each iteration
			await asyncio.sleep(tolerance)  # wait
			match = await self.find_match(username, game, rank, tolerance=tolerance)
			if match:
				return match
		return None

	async def send_match(self, username, match, game):
		if not match or len(match) != 2:
			logging.error("Matchmaking: send_match: Match not found or incomplete")
			user_mm_group_name = f"user_mm_{username}"
			await channel_layer.group_send(
			user_mm_group_name, {"type": "match.notFound"})
			return
		player1 = match[0] # player1 dictionary
		player2 = match[1] # player2 dictionary
		player1_username = player1['username']
		player2_username = player2['username']
		player1_mm_group_name = f"user_mm_{player1_username}"
		player2_mm_group_name = f"user_mm_{player2_username}"

		await channel_layer.group_send(
			player1_mm_group_name, player2_mm_group_name,
			{
				"type": "match.found",
				"game": game,
				"player1": player1_username,
				"player2": player2_username,
			}
		)


	async def remove_player(self, username, game):
		queue_key = f"queue:{game}"
		queue_length = self.redis_client.llen(queue_key)

		# remove player from queue
		for i in range(queue_length):
			player_data = self.redis_client.lindex(queue_key, i)
			player = json.loads(player_data)

			if player["username"] == username:
				self.redis_client.lrem(queue_key, 1, player_data)
				break


# single instance
matchmaking_manager = MatchmakingManager()
