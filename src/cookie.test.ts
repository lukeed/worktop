import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as Cookie from './cookie';

// ---

const stringify = suite('stringify');

stringify('should be a function', () => {
	assert.type(Cookie.stringify, 'function');
});

stringify('should stringify a name=value pair', () => {
	assert.is(
		Cookie.stringify('foo', 'bar'),
		'foo=bar'
	);
});

stringify('should encode the value', () => {
	assert.is(
		Cookie.stringify('foobar', 'hello world'),
		'foobar=hello%20world'
	);
});

stringify('should allow attributes :: expires', () => {
	const expires = new Date;

	assert.is(
		Cookie.stringify('foo', 'bar', { expires }),
		`foo=bar; Expires=${expires.toUTCString()}`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { expires: +expires }),
		`foo=bar; Expires=${expires.toUTCString()}`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { expires: expires.toUTCString() }),
		`foo=bar; Expires=${expires.toUTCString()}`
	);
});

stringify('should allow attributes :: maxage', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { maxage: 0 }),
		`foo=bar; Max-Age=0`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { maxage: 10e3 }),
		`foo=bar; Max-Age=10000`
	);
});

stringify('should allow attributes :: secure', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { secure: true }),
		`foo=bar; Secure`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { secure: false }),
		`foo=bar`
	);
});

stringify('should allow attributes :: httponly', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { httponly: true }),
		`foo=bar; HttpOnly`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { httponly: false }),
		`foo=bar`
	);
});

stringify('should allow attributes :: httponly + secure', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { httponly: true, secure: true }),
		`foo=bar; Secure; HttpOnly`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { httponly: false, secure: true }),
		`foo=bar; Secure`
	);
});

stringify('should allow attributes :: samesite', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { samesite: 'Lax' }),
		`foo=bar; SameSite=Lax`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { samesite: 'Strict' }),
		`foo=bar; SameSite=Strict`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { samesite: 'None' }),
		`foo=bar; SameSite=None; Secure`
	);
});

stringify('should allow attributes :: samesite + secure', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { secure: true, samesite: 'Lax' }),
		`foo=bar; SameSite=Lax; Secure`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { secure: true, samesite: 'Strict' }),
		`foo=bar; SameSite=Strict; Secure`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { secure: true, samesite: 'None' }),
		`foo=bar; SameSite=None; Secure`
	);
});

stringify('should allow attributes :: domain', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { domain: 'mozilla.org' }),
		`foo=bar; Domain=mozilla.org`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { domain: '.example.com' }),
		`foo=bar; Domain=.example.com`
	);
});

stringify('should allow attributes :: path', () => {
	assert.is(
		Cookie.stringify('foo', 'bar', { path: '/' }),
		`foo=bar; Path=/`
	);

	assert.is(
		Cookie.stringify('foo', 'bar', { path: '/docs' }),
		`foo=bar; Path=/docs`
	);
});

stringify('should allow attributes :: kitchen sink', () => {
	const NOW = new Date;

	let output = Cookie.stringify('foo', 'bar', {
		expires: NOW,
		domain: 'example.com',
		samesite: 'Strict',
		maxage: 123456789,
		httponly: true,
		secure: true,
		path: '/api',
	});

	assert.is(output, `foo=bar; Expires=${NOW.toUTCString()}; Max-Age=123456789; Domain=example.com; Path=/api; SameSite=Strict; Secure; HttpOnly`);
});

stringify.run();


// ---


const parse = suite('parse');

parse('should be a function', () => {
	assert.type(Cookie.parse, 'function');
});

parse('should convert a string into a object', () => {
	assert.equal(
		Cookie.parse('foo=bar'),
		{ foo: 'bar' }
	);
});

parse('should decode string value', () => {
	assert.equal(
		Cookie.parse('foobar=hello%20world'),
		{ foobar: 'hello world' }
	);
});

parse('should maintain original value when decode fails', () => {
	assert.equal(
		Cookie.parse('foobar=foo%%bar'),
		{ foobar: 'foo%%bar' }
	);
});

parse('should unwrap quoted "value"s', () => {
	assert.equal(
		Cookie.parse('foo="bar"'),
		{ foo: 'bar' }
	);
});

parse('should unwrap quoted "value"s', () => {
	assert.equal(
		Cookie.parse('foo="bar"'),
		{ foo: 'bar' }
	);
});

parse('should decode attributes :: expires', () => {
	const expires = new Date;
	expires.setUTCMilliseconds(0);
	const output = Cookie.parse(`foo=bar; Expires=${expires.toUTCString()}`);
	assert.instance(output.expires, Date);

	assert.equal(output, {
		foo: 'bar',
		expires: expires
	});
});

parse('should decode attributes :: maxage', () => {
	const output = Cookie.parse(`foo=bar; Max-Age=0`);
	assert.type(output.maxage, 'number');

	assert.equal(output, {
		'foo': 'bar',
		maxage: 0
	});

	assert.equal(
		Cookie.parse(`foo=bar; Max-Age=10000`),
		{ 'foo': 'bar', maxage: 10e3 },
	);
});

parse('should decode attributes :: secure', () => {
	assert.equal(
		Cookie.parse(`foo=bar; Secure`),
		{ 'foo': 'bar', secure: true },
	);
});

parse('should decode attributes :: httponly', () => {
	assert.equal(
		Cookie.parse(`foo=bar; HttpOnly`),
		{ 'foo': 'bar', httponly: true },
	);

	assert.equal(
		Cookie.parse(`foo=bar; Secure; HttpOnly`),
		{ 'foo': 'bar', httponly: true, secure: true },
	);

	assert.equal(
		Cookie.parse(`foo=bar; HttpOnly; Secure`),
		{ 'foo': 'bar', httponly: true, secure: true },
	);
});

parse('should decode attributes :: samesite', () => {
	assert.equal(
		Cookie.parse(`foo=bar; SameSite=Lax`),
		{ 'foo': 'bar', samesite: 'Lax' },
	);

	assert.equal(
		Cookie.parse(`foo=bar; SameSite=Strict`),
		{ 'foo': 'bar', samesite: 'Strict' },
	);

	assert.equal(
		Cookie.parse(`foo=bar; SameSite=None; Secure`),
		{ 'foo': 'bar', samesite: 'None', secure: true },
	);
});

parse('should decode attributes :: samesite + secure', () => {
	assert.equal(
		Cookie.parse(`foo=bar; SameSite=Lax; Secure`),
		{ 'foo': 'bar', secure: true, samesite: 'Lax' },
	);

	assert.equal(
		Cookie.parse(`foo=bar; SameSite=Strict; Secure`),
		{ 'foo': 'bar', secure: true, samesite: 'Strict' },
	);

	assert.equal(
		Cookie.parse(`foo=bar; SameSite=None; Secure`),
		{ 'foo': 'bar', secure: true, samesite: 'None' },
	);
});

parse('should decode attributes :: domain', () => {
	assert.equal(
		Cookie.parse(`foo=bar; Domain=mozilla.org`),
		{ 'foo': 'bar', domain: 'mozilla.org' },
	);

	assert.equal(
		Cookie.parse(`foo=bar; Domain=.example.com`),
		{ 'foo': 'bar', domain: '.example.com' },
	);
});

parse('should decode attributes :: path', () => {
	assert.equal(
		Cookie.parse(`foo=bar; Path=/`),
		{ 'foo': 'bar', path: '/' },
	);

	assert.equal(
		Cookie.parse(`foo=bar; Path=/docs`),
		{ 'foo': 'bar', path: '/docs' },
	);
});

parse('should decode attributes :: kitchen sink', () => {
	const NOW = new Date;
	NOW.setUTCMilliseconds(0);

	assert.equal(
		Cookie.parse(`foo=bar; Expires=${NOW.toUTCString()}; Max-Age=123456789; Domain=example.com; Path=/api; SameSite=Strict; Secure; HttpOnly`),
		{
			foo: 'bar',
			expires: NOW,
			domain: 'example.com',
			samesite: 'Strict',
			maxage: 123456789,
			httponly: true,
			secure: true,
			path: '/api',
		}
	);
});

parse.run();
