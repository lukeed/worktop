import { reply } from 'worktop/response';
import type { Bindings } from 'worktop/cfw';
import type { Durable } from 'worktop/cfw.durable';

export class DurableKVObject implements Durable.Object {
	state: Durable.State;
	storage: Durable.Storage;
	env: Bindings;
	id: string;

	constructor(state: Durable.State, env: Bindings) {
		this.id = state.id.toString();
		this.storage = state.storage;
		this.state = state;
		this.env = env;
	}

	async fetch(input: Request|string, init?: RequestInit) {
		try {
			let request = new Request(input, init);
			return await this.handle(request);
		} catch (err) {
			return reply(500, {
				success: false,
				error: String(err)
			});
		}
	}

	async handle(req: Request) {
		const body = await req.json();

		switch (body.op) {
			case 'get': {
				// TODO: one vs many
				let result = await this.storage.get(body.keys)

				return reply(200, {
					success: true,
					result: result
				});
			}

			case 'put': {
				if (body.options?.denyOverwrite) {
					const existing = await this.storage.get(Object.keys(body.entries))
					if (existing.size > 0) return reply(409, {success: false, error: 'conflict: cannot write to an existing key with denyOverwrite'})
				}
				const opRes = await this.storage.put(body.entries);
				return reply(200, {success: true});
			}

			case 'list': {
				const opRes = await this.storage.list({prefix: body.options.prefix});
				return reply(200, {success:true, result: Array.from(opRes.values())});
			}

			case 'delete': {
				const opRes = await this.storage.delete(body.keys);
				return reply(200, {success: true});
			}

			default: {
				return reply(400);
			}
		}
	}
}
