import { Router } from 'worktop';
import { send } from 'worktop/response';
import * as Cache from 'worktop/cache';
import type { Context  } from 'worktop';

interface Custom extends Context {
	bindings: {
		FALLBACK: string;
	}
}

const API = new Router<Custom>();

API.add('GET', '/greet/:name?', (req, context) => {
	let name = context.params.name || context.bindings.FALLBACK;
	return new Response(`Hello, ${name}!`);
});

API.add('GET', '/', (req, context) => {
	let command = `$ curl https://${context.url.hostname}/greet/lukeed`;
	let text = `Howdy~! Please greet yourself; for example:\n\n  ${command}\n`;

	return send(200, text, {
		'Cache-Control': 'public,max-age=60'
	});
});

export default Cache.reply(API.run);
