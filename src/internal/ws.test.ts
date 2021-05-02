import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ws from './ws';

const abort = suite('abort');

abort('should be a function', () => {
	assert.type(ws.abort, 'function');
});

abort.run();
