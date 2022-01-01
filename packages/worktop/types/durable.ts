import { Router } from 'worktop';
import { Actor } from 'worktop/cfw.durable';
import * as cookies from 'worktop/cookie';
import * as utils from 'worktop/utils';

import type { Bindings } from 'worktop/cfw';
import type { Durable } from 'worktop/cfw.durable';
import type { WebSocket } from 'worktop/ws';
import type { KV } from 'worktop/kv';

interface CustomBindings extends Bindings {
	SECRET: string;
	DATAB: KV.Namespace;
	COUNTER: Durable.Namespace;
	// @ts-expect-error
	COUNT: number;
}

// @ts-expect-error
let invalid = new Actor();

// @ts-expect-error - incomplete
export class Counter1 extends Actor {
	//
}

export class Counter2 extends Actor {
	DEBUG = true;

	async custom() {
		//
	}

	async setup(state: Durable.State, env: CustomBindings) {
		// external fetch
		await fetch('/logs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				event: 'setup',
				id: String(state.id),
				timestamp: Date.now(),
			})
		});

		// bindings are defined
		assert<Durable.Namespace>(env.COUNTER);
		assert<KV.Namespace>(env.DATAB);
		assert<string>(env.SECRET);

		// custom method
		await this.custom();
	}

	async receive(req: Request): Promise<Response> {
		return new Response('OK');
	}
}

export class Counter3 extends Actor {
	DEBUG = true;
	#pool = new Map<string, Set<WebSocket>>();

	async onconnect(req: Request, ws: WebSocket) {
		let value = req.headers.get('cookie')!;
		let { userid } = cookies.parse(value);

		let group = this.#pool.get(userid) || new Set;
		this.#pool.set(userid, group);
		group.add(ws);

		// setup custom listeners
		ws.addEventListener('close', this.onclose);
		ws.addEventListener('message', event => {
			assert<string>(event.data);
		});
	}

	async onclose(event: CloseEvent) {
		assert<string>(event.type);
	}

	async receive(req: Request): Promise<Response> {
		if (req.url.startsWith('/ws/')) {
			let token = req.headers.get('cookie');
			if (token) return this.connect(req);
			return new Response('Missing cookie', { status: 401 });
		}
		return new Response('OK');
	}
}

export class Counter4 extends Actor {
	#router: Router;
	#wait: Durable.State['waitUntil'];

	constructor(state: Durable.State, env: Bindings) {
		super(state, env);
		this.#router = new Router;
		// NOTE: don't actually need this
		this.#wait = state.waitUntil.bind(state);

		this.#router.add('GET', '/', (req, ctx) => {
			return new Response;
		});

		this.#router.add('POST', '/', async (req, ctx) => {
			let input = await utils.body<number[]>(req);
			return new Response('' + Math.max(...input!));
		});
	}

	receive(req: Request): Promise<Response> {
		return this.#router.run(req, {
			waitUntil: this.#wait
		});
	}
}

// https://github.com/lukeed/worktop/issues/120
export class Issue extends Actor {
	API = new Router;
	receive = this.API.run;

	constructor(public state: Durable.State, public bindings: Bindings) {
    super(state, bindings)
    this.setupRouter()
  }


  setupRouter() {
    this.API.add('GET', '/', () => {
      return new Response;
    })
  }
}

/**
 * NATIVE
 */

// NOTE: `implements D.O` is optional
export class Native implements Durable.Object {
	id: string;
	#env: Bindings;
	#storage: Durable.Storage;

	constructor(state: Durable.State, env: Bindings) {
		this.id = state.id.toString();

		this.#storage = state.storage;
		this.#env = env;
	}

	async fetch(input: RequestInfo, init?: RequestInit) {
		let request = new Request(input, init);
		let { pathname } = new URL(request.url);

		let prefix = this.#env.prefix as string;
		let key = prefix + ':' + pathname.replace(/[^a-z]/g, '.');
		let result = await this.#storage.get<number>(key);
		assert<number | void>(result);

		if (result && result > 0) {
			let txt = String(result);
			return new Response(txt);
		}

		return new Response;
	}
}

/**
 * STORAGE
 */

declare const storage: Durable.Storage;

let single = await storage.get<Item>('key', {
	allowConcurrency: true,
	noCache: true,
});

assert<Item | void>(single);

let results = await storage.get<Item>(['foo', 'bar'], {
	allowConcurrency: false,
	noCache: true,
});

assert<Map<string, Item>>(results);

// @ts-expect-error - value type
await storage.put<Item>('foo', 123);
await storage.put<Item>('foo', { foo: 'bar' });
assert<void>(
	await storage.put<Item>('foo', { foo: 'bar' }, {
		allowUnconfirmed: true,
		noCache: true,
	})
);

// @ts-expect-error - value type
await storage.put<Item>({ foo: 123 });

await storage.put<Item>({
	// @ts-expect-error
	hello: { foo: 123 },
	// @ts-expect-error
	world: { foo: ['bar'] },
	// this one is valid
	howdy: { foo: 'bar' },
});

// @ts-expect-error - key type
await storage.delete(123123);
assert<boolean>(
	await storage.delete('foobar', {
		allowUnconfirmed: true,
		noCache: true,
	})
);

// @ts-expect-error - key type
await storage.delete([1, 2, 3]);
assert<number>(
	await storage.delete(['foo', 'bar'], {
		allowUnconfirmed: true,
		noCache: true,
	})
);

// @ts-expect-error
await storage.deleteAll('foobar');
assert<void>(
	await storage.deleteAll()
);
assert<void>(
	await storage.deleteAll({
		allowUnconfirmed: true,
		noCache: true,
	})
);

// @ts-expect-error
await storage.list('foobar');

let items = await storage.list<Item>({
	limit: 12,
	reverse: true,
	prefix: 'foobar',
	start: 'foobar01',
	end: 'foobar99',
});

assert<Map<string, Item>>(items);
