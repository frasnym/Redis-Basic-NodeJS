const express = require("express"); // NodeJS framework
const axios = require("axios"); // Help with api call
const redis = require("redis"); // Required for caching

const app = express(); // Define express app

const redisPort = 6379; // Default port redis used
const client = redis.createClient(redisPort);

client.on("error", (e) => {
	console.log(e);
});

/**
 * API Endpoint
 * http://localhost:3000/jobs?search=node.js
 */
app.get("/jobs", async (req, res) => {
	const searchTerm = req.query.search; // Search term from req

	try {
		client.get(searchTerm, async (err, jobs) => {
			// Check if search term already available
			if (err) throw err;

			if (jobs) {
				// Cache found
				res.status(200).send({
					searchTerm,
					message: "from cache",
					jobs: JSON.parse(jobs),
				});
			} else {
				// Cache not found
				const jobs = await axios.get(
					`https://jobs.github.com/positions.json?search=${searchTerm}`
				);
				client.setex(searchTerm, 600, JSON.stringify(jobs.data)); // Create new cache
				res.status(200).send({
					searchTerm,
					message: "cache miss",
					jobs: jobs.data,
				});
			}
		});
	} catch (e) {
		res.status(500).send({ message: e.message });
	}
});

app.listen(3000, () => {
	// Serve serven on port 3000
	console.log("Up on port 3000");
});
