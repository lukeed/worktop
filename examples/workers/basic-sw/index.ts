import { Router } from 'worktop';
import { reply } from 'worktop/response';
import { start } from 'worktop/sw';

const API = new Router();

API.add('GET', '/', (req, context) => {
	let command = `$ curl https://${context.url.hostname}/greet/lukeed`;
	let text = `Howdy~! Please greet yourself; for example:\n\n  ${command}\n`;

	return reply(200, text, {
		'Cache-Control': 'public,max-age=60'
	});
});

API.add('GET', '/greet/:name?', (req, context) => {
	return new Response(`Hello, ${context.params.name}!`);
});

// Service Worker
start(API.run);
