import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as request from './request';

const toObject = suite('toObject');

toObject('should be a function', () => {
	assert.type(request.toObject, 'function');
});

toObject('should match `Object.fromEntries` for simple values', () => {
	let input = new URLSearchParams();
	input.set('hello', 'world');
	input.set('foo', 'bar');

	assert.equal(
		request.toObject(input),
		Object.fromEntries([...input])
	);
});

toObject('should keep multiple values per key', () => {
	let input = new URLSearchParams();
	input.append('hello', 'world');
	input.append('hello', 'there');
	input.set('foo', 'bar');

	const output = request.toObject(input);
	assert.not.equal(output, Object.fromEntries([...input]));

	assert.equal(output, {
		foo: 'bar',
		hello: ['world', 'there']
	});
});

toObject.run();

// ---
