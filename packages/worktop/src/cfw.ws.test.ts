import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ws from './cfw.ws';

const listen = suite('listen');

listen('should be a function', () => {
	assert.type(ws.listen, 'function');
});

listen('should return a function', () => {
	let out = ws.listen(() => {});
	assert.type(out, 'function');
});

listen.run();
