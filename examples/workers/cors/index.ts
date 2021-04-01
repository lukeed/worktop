import { Router, listen } from 'worktop';
import * as CORS from 'worktop/cors';

const API = new Router();

// TODO: Replace this with persistent layer
// Example – KV, Durable Object, or third-party
let counter = 0;

/**
 * Handles `OPTIONS` requests using the same settings.
 * NOTE: Call `CORS.preflight` per-route for inidivual settings.
 */
API.prepare = CORS.preflight({
	origin: '*', // allow any `Origin` to connect
	headers: ['Cache-Control', 'Content-Type', 'X-Count'],
	methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
});

API.add('GET', '/', (req, res) => {
	res.setHeader('X-Count', counter);
	res.send(200, counter);
});

API.add('POST', '/', (req, res) => {
	counter += 1;
	res.setHeader('X-Count', counter);
	res.send(200, counter);
});

API.add('PUT', '/', async (req, res) => {
	try {
		var next = Number(await req.body<string|number>());
		if (next * 0 !== 0) return res.send(400, 'Invalid number!');
	} catch (err) {
		return res.send(400, 'Error parsing request');
	}
	counter = next;
	res.setHeader('X-Count', counter);
	res.send(200, counter);
});

API.add('DELETE', '/', (req, res) => {
	counter -= 1;
	res.setHeader('X-Count', counter);
	res.send(200, counter);
});

listen(API.run);
