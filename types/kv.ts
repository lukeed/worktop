import { Database, list, paginate, until } from 'worktop/kv';
import type { KV } from 'worktop/kv';

/**
 * WORKTOP/KV
 */

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

interface Identifiers {
	user: IUser['id'];
	app: IApp['uid'];
}

declare const APPS: KV.Namespace;
declare const len11: Fixed.String<11>;
declare function toUID(): Fixed.String<11>;

const DB1 = new Database<Models>(APPS);
const DB2 = new Database<Models, Identifiers>(APPS);

async function storage() {
	// @ts-expect-error -> string
	await APPS.get<number>('key');
	// @ts-expect-error -> ArrayBuffer
	await APPS.get<number>('key', 'arrayBuffer');
	// @ts-expect-error -> ReadableStream
	await APPS.get<number>('key', 'stream');
	// @ts-expect-error -> string
	await APPS.get<number>('key', 'text');

	assert<string|null>(await APPS.get('key'));
	assert<string|null>(await APPS.get('key', 'text'));
	assert<ArrayBuffer|null>(await APPS.get('key', 'arrayBuffer'));
	assert<number|null>(await APPS.get<number>('key', 'json'));
	assert<IUser|null>(await APPS.get<IUser>('key', 'json'));
	assert<unknown|null>(await APPS.get('key', 'json'));

	// @ts-expect-error - number
	await DB1.get('user', 1235678);

	// @ts-expect-error - not fixed string
	await DB2.get('app', 'asd'); // DB2 is explicit
	await DB2.get('app', len11);
	await DB1.get('app', 'asd'); // DB1 is guessing

	assert<IUser|null>(await DB1.get('user', 'id'));
	assert<IApp|null>(await DB2.get('app', len11));

	assert<IUser|null>(await DB1.get('user', 'id', 'json'));
	assert<IUser|null>(await DB1.get('user', 'id', { type: 'json' }));
	assert<IUser|null>(await DB1.get('user', 'id', { type: 'json', metadata: false }));

	// @ts-expect-error - should not be metadata
	assert<KV.GetMetadata<IUser>>(await DB1.get('user', 'id', { type: 'json', metadata: false }));
	assert<KV.GetMetadata<IUser>>(await DB1.get('user', 'id', { type: 'json', metadata: true }));

	// @ts-expect-error - return type mismatch
	assert<IUser|null>(await DB1.get('user', 'id', { metadata: true }));

	// @ts-expect-error - missing `type` option
	assert<KV.GetMetadata<IUser>>(await DB1.get('user', 'id', { metadata: true }));

	let user123 = await DB1.get('user', 'id', { type: 'json', metadata: true });
	assert<KV.GetMetadata<IUser>>(user123);
	assert<KV.Metadata|null>(user123.metadata);
	assert<IUser|null>(user123.value);

	// allows `Metadata` override, since `DB.get` cannot take type arg
	let metadata = user123.metadata as Record<'foo'|'bar', number>;

	let user: IUser = {
		id: 'asd',
		name: 'foobar',
		age: 123
	};

	assert<boolean>(await DB1.put('user', user.id, user, { toJSON: false }));
	assert<boolean>(await DB1.put('user', user.id, user, { toJSON: true }));
	assert<boolean>(await DB1.put('user', user.id, user));
	assert<boolean>(await DB1.del('user', user.id));

	await DB1.put('user', user.id, user, {
		toJSON: false,
		expiration: 123,
		metadata: { foo: 123 }
	});

	const lookup = (uid: Fixed.String<11>) => DB2.get('app', uid);
	assert<Fixed.String<11>>(await until(toUID, lookup));

	let lister = list(APPS, { prefix: 'asd' });
	assert<AsyncGenerator>(lister);

	for await (let result of lister) {
		assert<boolean>(result.done);
		assert<string[]>(result.keys);
	}

	for await (let result of list(APPS, { metadata: true })) {
		assert<boolean>(result.done);
		assert<KV.KeyInfo[]>(result.keys);

		assert<string>(result.keys[0].name);
		assert<number|undefined>(result.keys[0].expiration);
		assert<KV.Metadata|undefined>(result.keys[0].metadata);
	}

	for await (let result of list<IUser>(APPS, { metadata: true })) {
		assert<boolean>(result.done);
		assert<KV.KeyInfo<IUser>[]>(result.keys);

		assert<string>(result.keys[0].name);
		assert<number|undefined>(result.keys[0].expiration);
		assert<KV.Metadata|undefined>(result.keys[0].metadata);
		assert<IUser|undefined>(result.keys[0].metadata);
	}

	assert<string[]>(await paginate(APPS, { prefix: 'apps::123' }));
	assert<string[]>(await paginate(APPS, { prefix: 'apps::123', metadata: false }));
	assert<KV.KeyInfo[]>(await paginate(APPS, { prefix: 'apps::123', metadata: true }));

	let keys = await paginate(APPS, { page: 2, limit: 12, prefix: 'hello' });
	assert<string>(keys[0]);
}
