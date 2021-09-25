import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as KV from './kv';

const Namespace = () => ({}) as any;
const Mock = (x?: any) => {
	let args: any[], f = (...y: any[]) => (args=y,Promise.resolve(x));
	// @ts-ignore
	return f.args = () => args,f;
}

const read = suite('read');

read('should be a function', () => {
	assert.type(KV.read, 'function');
});

read('should call `get()` binding method', async () => {
	let binding = Namespace();
	binding.get = Mock(123);

	assert.is(await KV.read(binding, 'foobar'), 123);
	assert.equal(binding.get.args(), ['foobar', 'json']);

	await KV.read(binding, 'foobar', 'text');
	assert.equal(binding.get.args(), ['foobar', 'text']);
});

read('should return false if `get()` returns null', async () => {
	let binding = Namespace();
	binding.get = Mock(null);

	assert.is(await KV.read(binding, 'foobar'), null);
});

read('should return false if `get()` returns false', async () => {
	let binding = Namespace();
	binding.get = Mock(false);

	assert.is(await KV.read(binding, 'foobar'), false);
});

read.run();

// ---

const write = suite('write');

write('should be a function', () => {
	assert.type(KV.write, 'function');
});

write('should call `put()` binding method', async () => {
	let binding = Namespace();
	binding.put = Mock();

	await KV.write(binding, 'foobar', 'value');
	assert.equal(
		binding.put.args(),
		['foobar', 'value', undefined]
	);
});

write('should return `true` when sucessful', async () => {
	let binding = Namespace();
	binding.put = () => Promise.resolve();

	assert.is(await KV.write(binding, 'foobar', 'value'), true);
});

write('should return `false` instead of throwing', async () => {
	let binding = Namespace();
	binding.put = () => Promise.reject();
	assert.is(await KV.write(binding, 'foobar', 'value'), false);
});

write('should force `JSON.stringify` on value :: { toJSON: true }', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let input = 'value';
	let real = JSON.stringify('value');

	await KV.write(binding, 'foobar', input, { toJSON: true });
	assert.equal(binding.put.args(), ['foobar', real, { toJSON: true }]);
});

write('should force `JSON.stringify` on value :: object', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let input = { foo: 123 };
	let real = JSON.stringify(input);

	await KV.write(binding, 'foobar', input);
	assert.equal(binding.put.args(), ['foobar', real, undefined]);
});

write('should force `JSON.stringify` on value :: array', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let input = [1, 2, 3];
	let real = JSON.stringify(input);

	await KV.write(binding, 'foobar', input);
	assert.equal(binding.put.args(), ['foobar', real, undefined]);
});

write('should force `JSON.stringify` on value :: boolean', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let input = true;
	let real = JSON.stringify(input);

	await KV.write(binding, 'foobar', input);
	assert.equal(binding.put.args(), ['foobar', real, undefined]);
});

write('should skip `JSON.stringify` :: ReadableStream', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let item = new ReadableStream();
	await KV.write(binding, 'foobar', item);
	assert.equal(binding.put.args(), ['foobar', item, undefined]);
});

write('should ignore `toJSON` option :: ReadableStream', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let item = new ReadableStream();
	await KV.write(binding, 'foobar', item, { toJSON: true });
	assert.equal(binding.put.args(), ['foobar', item, { toJSON: true }]);
});

write('should skip `JSON.stringify` :: ArrayBuffer', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let item = new ArrayBuffer(1);
	await KV.write(binding, 'foobar', item);
	assert.equal(binding.put.args(), ['foobar', item, undefined]);
});

write('should ignore `toJSON` option :: ArrayBuffer', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let item = new ArrayBuffer(1);
	await KV.write(binding, 'foobar', item, { toJSON: true });
	assert.equal(binding.put.args(), ['foobar', item, { toJSON: true }]);
});

write('shoud allow `expiration` options', async () => {
	let binding = Namespace();
	binding.put = Mock();

	let input = { foo: 123 };
	let real = JSON.stringify(input);
	let options = { expiration: 123 };
	await KV.write(binding, 'foobar', input, options);
	assert.equal(binding.put.args(), ['foobar', real, options]);
});

write.run();

// ---

const remove = suite('remove');

remove('should be a function', () => {
	assert.type(KV.remove, 'function');
});

remove('should call `delete()` binding method', async () => {
	let binding = Namespace();
	binding.delete = Mock();

	await KV.remove(binding, 'foobar');
	assert.equal(binding.delete.args(), ['foobar']);
});

remove('should return `true` when sucessful', async () => {
	let binding = Namespace();
	binding.delete = () => Promise.resolve();

	assert.is(await KV.remove(binding, 'foobar'), true);
});

remove('should return `false` instead of throwing', async () => {
	let binding = Namespace();
	binding.delete = () => Promise.reject();
	assert.is(await KV.remove(binding, 'foobar'), false);
});

remove.run();

// ---

const Database = suite('Database');

Database('should be a function', () => {
	assert.type(KV.Database, 'function');
});

Database('should return `Database` interface', () => {
	let binding = Namespace();
	const DB = KV.Database(binding);
	assert.type(DB.get, 'function');
	assert.type(DB.put, 'function');
	assert.type(DB.del, 'function');
});

declare namespace Fixed {
	type String<N extends number> = { 0: string; length: N } & string;
}

interface IUser {
	id: string;
	name: string;
	age: number;
}

interface IApp {
	uid: Fixed.String<11>;
	name: string;
}

interface Models {
	user: IUser;
	app: IApp;
}

Database('should proxy `binding.get` via `DB.get` method', async () => {
	let binding = Namespace();
	const DB = KV.Database<Models>(binding);
	let user: Partial<IUser> = { id: 'foobar' };

	binding.get = Mock(null); // null => as is
	assert.is(await DB.get('user', 'foobar'), null);
	assert.equal(binding.get.args(), ['user__foobar', 'json']);

	binding.get = Mock(user);
	assert.equal(await DB.get('user', 'foobar'), user);
	assert.equal(binding.get.args(), ['user__foobar', 'json']);

	binding.get = Mock(user);
	assert.equal(await DB.get('user', 'foobar', 'text'), user);
	assert.equal(binding.get.args(), ['user__foobar', 'text']);
});

Database('should proxy `binding.put` via `DB.put` method', async () => {
	let binding = Namespace();
	const DB = KV.Database<Models>(binding);
	let user: IUser = {
		id: 'foobar',
		name: 'foobob',
		age: 100,
	};

	let real = JSON.stringify(user);

	binding.put = Mock();
	assert.is(await DB.put('user', 'foobar', user), true); // success
	assert.equal(binding.put.args(), ['user__foobar', real, { toJSON: true }]);

	binding.put = Mock();
	let options = { expiration: 12345 };
	assert.is(await DB.put('user', 'foobar', user, options), true); // success
	assert.equal(binding.put.args(), ['user__foobar', real, { toJSON: true, ...options }]);
});

Database('should proxy `binding.delete` via `DB.del` method', async () => {
	let binding = Namespace();
	const DB = KV.Database<Models>(binding);

	binding.delete = Mock();
	assert.is(await DB.del('user', 'foobar'), true); // success
	assert.equal(binding.delete.args(), ['user__foobar']);

	binding.delete = () => Promise.reject();
	assert.is(await DB.del('user', 'foobar'), false); // fail
});

interface Identifiers {
	user: IUser['id'];
	app: IApp['uid'];
}

Database('should accept strict `Identifiers` type arg', async () => {
	let binding = Namespace();
	const DB = KV.Database<Models, Identifiers>(binding);
	binding.get = Mock();

	// @ts-expect-error
	await DB.get('app', 'too short');

	let uid = 'fake it' as Fixed.String<11>;
	await DB.get('app', uid, 'text');
	await DB.get('app', uid);
});

Database('should allow `DB.put()` to save non-JSON', async () => {
	let binding = Namespace();
	let DB = KV.Database<{ foo: string }>(binding);
	binding.put = Mock();

	let input = 'value';
	let real = JSON.stringify(input);

	await DB.put('foo', 'id', input);
	assert.equal(binding.put.args(), ['foo__id', real, { toJSON: true }]);

	await DB.put('foo', 'id', input, { toJSON: false }); // NO CAST
	assert.equal(binding.put.args(), ['foo__id', input, { toJSON: false }]);
});

Database.run();

// ---

const until = suite('until');

until('should be a function', () => {
	assert.type(KV.until, 'function');
});

until('should loop until first `nullish` value', async () => {
	let values = ['1', '2', '3', '4', '5'];
	let output = await KV.until(
		() => values.shift() || '',
		(x) => Promise.resolve(+x < 3 ? +x : null)
	);
	assert.is(output, '3');
	assert.equal(values, ['4', '5']);
});

until.run();
