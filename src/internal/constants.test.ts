import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as constants from './constants';

const STATUS_CODES = suite('STATUS_CODES');

STATUS_CODES('should be an object', () => {
	assert.type(constants.STATUS_CODES, 'object');
});

STATUS_CODES('should have String(number) keys', () => {
	Object.keys(constants.STATUS_CODES).forEach(key => {
		assert.type(key, 'string');
		assert.ok(+key > 0, 'is not NaN');
	});
});

STATUS_CODES('should be mutable', () => {
	const original = constants.STATUS_CODES['404'];
	assert.is(original, 'Not Found');

	constants.STATUS_CODES['404'] = 'hello123';
	assert.is.not(constants.STATUS_CODES['404'], original);
	assert.is(constants.STATUS_CODES['404'], 'hello123');
	constants.STATUS_CODES['404'] = original;
});

STATUS_CODES.run();

// ---

const CLENGTH = suite('CLENGTH');

CLENGTH('should be a string', () => {
	assert.type(constants.CLENGTH, 'string');
});

CLENGTH('should have "content-length" value', () => {
	assert.is(constants.CLENGTH, 'content-length');
});

CLENGTH.run();

// ---

const CTYPE = suite('CTYPE');

CTYPE('should be a string', () => {
	assert.type(constants.CTYPE, 'string');
});

CTYPE('should have "content-type" value', () => {
	assert.is(constants.CTYPE, 'content-type');
});

CTYPE.run();
