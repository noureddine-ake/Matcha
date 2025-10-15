// // src/config/redisClient.js
import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

await redisClient.connect(); // ✅ top-level await works in ES module

console.log('✅ Redis connected');

export default redisClient;