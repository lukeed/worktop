import { Router } from 'worktop';

const API = new Router();

API.add('GET', '/greet/:name', (req, res) => {
	res.end(`Hello, ${req.params.name}!`);
});

API.add('GET', '/', (req, res) => {
	const command = `$ curl https://${req.hostname}/greet/lukeed`;

	res.setHeader('Cache-Control', 'public,max-age=60');
	res.end(`Howdy~! Please greet yourself; for example:\n\n  ${command}\n`);
});

addEventListener('fetch', API.listen);
