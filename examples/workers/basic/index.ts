import { Router } from 'worktop';
import * as Cache from 'worktop/cache';
import { reply } from 'worktop/response';

const API = new Router();

API.add('GET', '/greet/:name', (req, context) => {
	return new Response(`Hello, ${context.params.name}!`);
});

API.add('GET', '/', (req, context) => {
	let command = `$ curl https://${context.url.hostname}/greet/lukeed`;
	let text = `Howdy~! Please greet yourself; for example:\n\n  ${command}\n`;

	return reply(200, text, {
		'Cache-Control': 'public,max-age=60'
	});
});

// NOTE: manual because SW is not assumed
addEventListener('fetch', event => {
	event.respondWith(
		Cache.lookup(event.request).then(prev => {
			return prev || API.run(event.request, event).then(res => {
				return Cache.save(event.request, res, event);
			});
		})
	);
});
