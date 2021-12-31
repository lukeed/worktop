import { Router } from 'worktop';
import * as CORS from 'worktop/cors';
import * as mod from 'worktop/module';
import * as utils from 'worktop/utils';

const API = new Router();

// TODO: Replace this with persistent layer
// Example – KV, Durable Object, or third-party
let counter = 0;

function reply(status: number, count: number) {
	let value = String(count);
	let headers = { 'x-count': value };
	return new Response(value, { status, headers });
}

function error(status: number, message: string) {
	return new Response(message, { status });
}

/**
 * Handles `OPTIONS` requests using the same settings.
 * NOTE: Call `CORS.preflight` per-route for individual settings.
 */
API.prepare = CORS.preflight({
	origin: '*', // allow any `Origin` to connect
	headers: ['Cache-Control', 'Content-Type', 'X-Count'],
	methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
});

API.add('GET', '/', (req, context) => {
	return reply(200, counter);
});

API.add('POST', '/', (req, context) => {
	counter += 1;
	return reply(200, counter);
});

API.add('PUT', '/', async (req, context) => {
	try {
		var next = Number(await utils.body<string>(req));
		if (next * 0 !== 0) return error(400, 'Invalid number!');
	} catch (err) {
		return error(400, 'Error parsing request');
	}

	counter = next;
	return reply(200, counter);
});

API.add('DELETE', '/', (req, context) => {
	counter -= 1;
	return reply(200, counter);
});

// Module Worker
export default mod.reply(API.run);
