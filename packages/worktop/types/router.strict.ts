import * as Cache from 'worktop/cache';
import { Router, compose } from 'worktop';
import * as modules from 'worktop/cfw';
import * as sw from 'worktop/sw';

import type { Context } from 'worktop';
import type { Bindings } from 'worktop/cfw';
import type { Durable } from 'worktop/cfw.durable';
import type { KV } from 'worktop/kv';

interface Custom extends Context {
	start?: number;
	bindings: {
		SECRETZ: string;
		ANIMALS: KV.Namespace;
		COUNTER: Durable.Namespace;
		HASHKEY: CryptoKey;
	};
}

const API = new Router<Custom>();

API.prepare = compose(
	Cache.sync(),
	function (req, context) {
		context.start = Date.now();
	},
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
});

/**
 * init: service worker
 */
sw.start(API.run);

/**
 * init: module worker
 */
export default modules.start(API.run);
