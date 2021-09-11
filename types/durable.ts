import { Router } from 'worktop';
import { Actor } from 'worktop/durable';
import * as cookies from 'worktop/cookie';
import type { Durable } from 'worktop/durable';
import type { WebSocket } from 'worktop/ws';
import type { Bindings } from 'worktop';
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
class Counter1 extends Actor {
	//
}

class Counter2 extends Actor {
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

class Counter3 extends Actor {
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

class Counter4 extends Actor {
	#router: Router;
	#wait: Durable.State['waitUntil'];

	constructor(state: Durable.State, env: Bindings) {
		super(state, env);
		this.#router = new Router;
		// NOTE: don't actually need this
		this.#wait = state.waitUntil.bind(state);

		this.#router.add('GET', '/', (req, res) => {
			res.end('OK');
		});

		this.#router.add('POST', '/', async (req, res) => {
			let input = await req.body<number[]>();
			res.send(200, Math.max(...input!));
		});
	}

	receive(req: Request): Promise<Response> {
		return this.#router.run({
			request: req,
			waitUntil: this.#wait,
		} as FetchEvent);
	}
}
