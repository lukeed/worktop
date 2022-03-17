import { connect } from 'worktop/ws';

import type { Bindings } from 'worktop/cfw';
import type { WebSocket } from 'worktop/cfw.ws';
import type { Operations } from './internal/durable';
import type { Durable, Model as M } from 'worktop/cfw.durable';

export abstract class Actor {
	DEBUG: boolean;

	constructor(state: Durable.State, bindings: Bindings) {
		if (this.setup) state.blockConcurrencyWhile(() => this.setup!(state, bindings));
		this.DEBUG = false;
	}

	setup?(state: Durable.State, bindings: Bindings): Promise<void> | void;
	onconnect?(req: Request, ws: WebSocket): Promise<void> | void;

	abstract receive(req: Request): Promise<Response> | Response;

	async connect(req: Request): Promise<Response> {
		let error = connect(req);
		if (error) return error;

		let { 0: client, 1: server } = new WebSocketPair;

		server.accept();

		function closer() {
			server.close();
		}

		server.addEventListener('close', closer);
		server.addEventListener('error', closer);

		if (this.onconnect) {
			await this.onconnect(req, server);
		}

		return new Response(null, {
			status: 101,
			statusText: 'Switching Protocols',
			webSocket: client,
		});
	}

	async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
		try {
			let request = new Request(input, init);
			return await this.receive(request);
		} catch (err) {
			let msg = this.DEBUG && (err as Error).stack;
			return new Response(msg || 'Error with receive', { status: 400 });
		}
	}
}

interface Actions {
	get: Operations.GET;
	list: Operations.LIST;
	delete: Operations.DELETE;
	put: Operations.PUT;
}

export class Model implements M {
	#ns: Durable.Namespace

	constructor(ns: Durable.Namespace) {
		this.#ns = ns;
	}

	get(type: string, key: string|string[], options?: Durable.Storage.Options.Get) {
		let args: Operations.GET = [key, options];
		return this.#query(type, 'get', args);
	}

	put(type: string, ...x: any[]) {
		let args = x as Operations.PUT;
		return this.#query(type, 'put', args);
	}

	delete(type: string, key: string | string[]) {
		let args = [key] as Operations.DELETE;
		return this.#query(type, 'delete', args);
	}

	list(type: string, prefix='') {
		let args: Operations.LIST = [{ prefix }];
		return this.#query(type, 'list', args);
	}

	async #query<K extends keyof Actions>(type: string, action: K, args: Actions[K]) {
		let uid = this.#ns.idFromName(type);
		let stub = this.#ns.get(uid);

		let url = new URL(action, 'http://internal');

		// TODO retries
		let res = await stub.fetch(url.href, {
			method: 'POST',
			headers: {
				'content-type': 'application/json;charset=utf-8'
			},
			body: JSON.stringify(args)
		});

		let body = await res.json();

		if ((res.status / 100 | 0) === 2) {
			if (body.result != null) return body.result;
			return body.results && new Map(body.results) || null;
		}

		throw new Error(body.error || 'Error executing query');
	}
}
