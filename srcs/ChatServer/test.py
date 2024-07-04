import redis
import os

# Use the environment variable REDIS_URL to connect to the Redis container
redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
redis_client = redis.from_url(redis_url)

try:
    response = redis_client.ping()
    print("PONG" if response else "No response from Redis")
except redis.ConnectionError:
    print("Failed to connect to Redis")

