import { Router } from 'worktop';
import { listen } from 'worktop/modules';

// binding: ENV variable
declare const FALLBACK: string;

const API = new Router();

API.add('GET', '/greet/:name?', (req, res) => {
	res.end(`Hello via Module, ${req.params.name || FALLBACK}!`);
});

API.add('GET', '/', (req, res) => {
	const command = `$ curl https://${req.hostname}/greet/lukeed`;

	res.setHeader('Cache-Control', 'public,max-age=60');
	res.end(`Howdy Module Worker~! Please greet yourself; for example:\n\n  ${command}\n`);
});

export default listen(API.run);
