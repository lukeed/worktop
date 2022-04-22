import { Router, compose } from 'worktop';
// import { Database } from 'worktop/cfw.durable';
import * as Cache from 'worktop/cfw.cache';
import * as cfw from 'worktop/cfw';
import * as sw from 'worktop/sw';

import type { Context } from 'worktop';
import type { Bindings } from 'worktop/cfw';
import type { Durable } from 'worktop/cfw.durable';
import type { KV } from 'worktop/cfw.kv';

// [[durable_objects]]
// class = "DataGroup"
// name = "STORAGE"
export { DataGroup } from 'worktop/cfw.durable';

interface Custom extends Context {
	start?: number;
	// database: Database;
	bindings: {
		SECRETZ: string;
		ANIMALS: KV.Namespace;
		COUNTER: Durable.Namespace;
		STORAGE: Durable.Namespace;
		HASHKEY: CryptoKey;
	};
}

const API = new Router<Custom>();

API.prepare = compose(
	function (req, context) {
		// timing response header
		context.start = Date.now();
		context.defer(res => {
			let ms = Date.now() - context.start!;
			res.headers.set('x-timing', '' + ms);
		});
	},

	// lookup (and/or save) request->response in cache
	Cache.sync(),

	// // setup the database
	// function (req, context) {
	// 	context.database = new Database(context.bindings.STORAGE);
	// }
);

API.add('GET', '/:foo/:bar?', async (req, context) => {
	assert<Custom>(context);

	// @ts-expect-error
	assert<string>(context.params.bar);
	assert<string|void>(context.params.bar);
	assert<string>(context.params.foo);

	// @ts-expect-error
	assert<number>(context.start);
	assert<number|void>(context.start);
	assert<number>(context.start!);

	assert<Bindings>(context.bindings);
	assert<string>(context.bindings.SECRETZ);
	assert<KV.Namespace>(context.bindings.ANIMALS);
	assert<Durable.Namespace>(context.bindings.COUNTER);
	assert<CryptoKey>(context.bindings.HASHKEY);

	// let { database } = context;
	// let { foo, bar='default' } = context.params;

	// let shard = `foo:${foo}`;

	// let success = await database.put<string>(shard, bar, 'hello', {
	// 	overwrite: true,
	// 	cacheTtl: 3600 // 1h
	// });

	// let item = await database.get<string>(shard, bar, {
	// 	cacheTtl: 3600, // 1h
	// 	noCache: false,
	// });

	// assert<string|void>(item);
});

/**
 * init: service worker
 */
cfw.listen(API.run);
sw.start(API.run);

/**
 * init: module worker
 */
export default cfw.start(API.run);
