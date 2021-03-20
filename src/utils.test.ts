import { suite } from 'uvu';
import { randomBytes } from 'crypto';
import * as assert from 'uvu/assert';
import * as utils from './utils';

// @ts-ignore
import isUUID from 'is-uuid';

globalThis.crypto = {
	// @ts-ignore
	getRandomValues(arr: Uint8Array) {
		return randomBytes(arr.length);
	}
};

// ---

const uuid = suite('uuid');

uuid('exports', () => {
	assert.type(utils.uuid, 'function', 'exports function');
});

uuid('returns', () => {
	let out = utils.uuid();
	assert.type(out, 'string', 'returns a string');
	assert.is(out.length, 36, '~> 36 characters long');
});

uuid('unique', () => {
	let length = 1e6;
	assert.is.not(utils.uuid(), utils.uuid(), '~> single');
	let unique = new Set(Array.from({ length }, utils.uuid));
	assert.is(unique.size, length, '~> 1,000,000 uniques');
});

uuid('validate', () => {
	let arr = Array.from({ length: 1e3 }, utils.uuid);
	assert.ok(arr.every(isUUID.v4));
});

uuid.run();
