import asyncio
import redis
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
channel_layer = get_channel_layer()
redis_client = redis.StrictRedis(host='redis', port=6379, db=0, decode_responses=True)

class MatchmakingManager:
	redis_client = redis_client
	matchmaking_tasks = {}


	async def start_matchmaking(self, username, game, rank):
		task = asyncio.current_task()
		try:
			match = await self.find_match(username, game, rank)
			if match:
				await self.send_match(username, match, game)
			else:
				match = await self.wait_for_match(username, game, rank)
				await self.send_match(username, match, game)
		except asyncio.CancelledError:
			logging.info(f"MatchmakingManager: start_matchmaking: Matchmaking task for {username} was cancelled.")
			return
		except Exception as e:
			logging.error(f"MatchmakingManager: start_matchmaking: An error occurred in the matchmaking task for {username}: {e}")
		finally:
			await self.cancel_matchmaking(username, game)


	async def add_player(self, username, game, rank):
		player_data = json.dumps({"username": username, "rank": rank})
		queue_key = f"queue:{game}"
		# check if player is already in the queue
		if self.redis_client.lrem(queue_key, 0, username) > 0:
			logging.info(f"User {username} is already in the {game} queue.")
			return
		self.redis_client.rpush(queue_key, player_data)
		task = asyncio.create_task(self.start_matchmaking(username, game, rank))
		self.matchmaking_tasks[username] = task
		logging.info(f"MatchmakingManager: add_player: Created task for {username} in {game} queue with rank {rank} task_id: {id(task)}")


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
			await self.remove_player(username, game)
			await self.remove_player(match["username"], game)
			return match
		return None


	async def wait_for_match(self, username, game, rank, step=1):
		for tolerance in range(1, 50, step):  # increase tolerance by 'step' each iteration
			await asyncio.sleep(tolerance)  # wait
			match = await self.find_match(username, game, rank, tolerance=tolerance)
			if match:
				return match
		return None


	async def send_match(self, username, match, game):
		user_mm_group_name = f"user_mm_{username}"
		if not match:
			logging.error("Matchmaking: send_match: Match not found")
			await channel_layer.group_send(
			user_mm_group_name, {"type": "match.notFound"})
			return
		opponent = match["username"]
		await channel_layer.group_send(
			user_mm_group_name,
			{
				"type": "match.found",
				"game": game,
				"opponent": opponent
			}
		)

	async def cancel_matchmaking(self, username, game):
		if username in self.matchmaking_tasks:
			task = self.matchmaking_tasks[username]
			if not task.done():  # check if the task is still running
				task.cancel()
			del self.matchmaking_tasks[username]  # remove from tracking
		await self.remove_player(username, game)


	async def remove_player(self, username, game):
		logging.info(f"Matchmaking: remove_player: Removing {username} from {game} queue")
		queue_key = f"queue:{game}"
		# get the full list of players in the queue
		queue_length = self.redis_client.llen(queue_key)
		for i in range(queue_length):
			player_data = self.redis_client.lindex(queue_key, i)
			if player_data is None:
				continue
			player = json.loads(player_data)
			# check if the username matches
			if player["username"] == username:
				# remove player data from the queue
				self.redis_client.lrem(queue_key, 1, player_data)  # remove the first occurrence of player_data
				logging.info(f"Matchmaking: remove_player: {username} successfully removed from {game} queue")
				break
		else:
			# if the loop completes without breaking, the user was not found
			logging.warning(f"Matchmaking: remove_player: {username} not found in {game} queue")


# single instance
matchmaking_manager = MatchmakingManager()
