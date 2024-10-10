import asyncio
import aioredis
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
channel_layer = get_channel_layer()
redis_client = aioredis.from_url("redis://redis:6379", decode_responses=True)

class MatchmakingManager:
	matchmaking_tasks = {}
	lock = asyncio.Lock()


	async def start_matchmaking(self, username, game, rank):
		task = asyncio.current_task()
		try:
			match = await MatchmakingManager.find_match(username, game, rank)
			if match:
				await MatchmakingManager.send_match(username, match, game)
			else:
				match = await MatchmakingManager.wait_for_match(username, game, rank)
				await MatchmakingManager.send_match(username, match, game)
		except asyncio.CancelledError:
			logging.info(f"MatchmakingManager: start_matchmaking: Matchmaking task for {username} was cancelled.")
		except Exception as e:
			logging.error(f"MatchmakingManager: start_matchmaking: An error occurred in the matchmaking task for {username}: {e}")
		finally:
			await MatchmakingManager.cancel_matchmaking(username, game)


	async def add_player(self, username, game, rank):
		player_data = json.dumps({"username": username, "rank": rank})
		queue_key = f"queue:{game}"
		# if user is already in the queue, remove them
		await MatchmakingManager.cancel_matchmaking(username, game)
		await redis_client.rpush(queue_key, player_data)
		task = asyncio.create_task(MatchmakingManager.start_matchmaking(username, game, rank))
		MatchmakingManager.matchmaking_tasks[username] = task
		logging.info(f"MatchmakingManager: add_player: Created task for {username} in {game} queue with rank {rank} task_id: {id(task)}")


	async def find_match(self, username, game, rank, tolerance=0):
		queue_key = f"queue:{game}"
		match = None
		# loop through queue list on redis
		queue_length = await redis_client.llen(queue_key)
		for i in range(queue_length):
			player_data = await redis_client.lindex(queue_key, i)
			player = json.loads(player_data)
			# check if i player is a match within tolerance
			if player["username"] != username and abs(rank - player["rank"]) <= tolerance:
				match = player
				break
		# if a match is found, remove both players from the queue
		if match:
			async with MatchmakingManager.lock:
				await MatchmakingManager.remove_player(username, game)
				await MatchmakingManager.remove_player(match["username"], game)
				return match
		return None


	async def wait_for_match(self, username, game, rank, step=1):
		for tolerance in range(1, 50, step):  # increase tolerance by 'step' each iteration
			await asyncio.sleep(tolerance)  # wait
			match = await MatchmakingManager.find_match(username, game, rank, tolerance=tolerance)
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
		if username in MatchmakingManager.matchmaking_tasks:
			task = MatchmakingManager.matchmaking_tasks[username]
			if not task.done():  # check if the task is still running
				task.cancel()
			del MatchmakingManager.matchmaking_tasks[username]  # remove from tracking
		await MatchmakingManager.remove_player(username, game)


	# needs to iterate through the list because of json format
	async def remove_player(self, username, game):
		logging.info(f"Matchmaking: remove_player: Removing {username} from {game} queue")
		queue_key = f"queue:{game}"
		# get the full list of players in the queue
		queue_length = await redis_client.llen(queue_key)
		for i in range(queue_length):
			player_data = await redis_client.lindex(queue_key, i)
			if player_data is None:
				continue
			player = json.loads(player_data)
			# check if the username matches
			if player["username"] == username:
				# remove player data from the queue
				await redis_client.lrem(queue_key, 0, player_data)
				logging.info(f"Matchmaking: remove_player: {username} successfully removed from {game} queue")
				break
		else:
			# if the loop completes without breaking, the user was not found
			logging.warning(f"Matchmaking: remove_player: {username} not found in {game} queue")


# single instance
matchmaking_manager = MatchmakingManager()
