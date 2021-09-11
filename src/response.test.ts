import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as response from './response';

const STATUS_CODES = suite('STATUS_CODES');

STATUS_CODES('should be an object', () => {
	assert.type(response.STATUS_CODES, 'object');
});

STATUS_CODES('should have String(number) keys', () => {
	Object.keys(response.STATUS_CODES).forEach(key => {
		assert.type(key, 'string');
		assert.ok(+key > 0, 'is not NaN');
	});
});

STATUS_CODES('should be mutable', () => {
	const original = response.STATUS_CODES['404'];
	assert.is(original, 'Not Found');

	response.STATUS_CODES['404'] = 'hello123';
	assert.is.not(response.STATUS_CODES['404'], original);
	assert.is(response.STATUS_CODES['404'], 'hello123');
	response.STATUS_CODES['404'] = original;
});

STATUS_CODES.run();
