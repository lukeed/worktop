import { reply } from "worktop/response"

export class DurableKVObject {
    state: DurableObjectState;
    storage: DurableObjectStorage;
    env: Env;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.storage = state.storage;
        this.env = env;
    }
  
    async fetch(req: Request) {
        try {
            return this.handle(req);
        } catch (e) {
            return reply(500, {success: false, error: e.toString()})
        }
    }

    async handle(req) {
        const body = await req.json()

        switch (body.op) {
            case "get": {
                const opRes = await this.storage.get(body.keys)
                return reply(200, {success:true, result: Object.fromEntries(opRes)})
            }
            case "put": {
                if (body.options?.denyOverwrite) {
                    const existing = await this.storage.get(Object.keys(body.entries))
                    if (existing.size > 0) {
                        return reply(409, {success: false, error: "conflict: cannot write to an existing key with denyOverwrite"})
                    }
                }
                const opRes = await this.storage.put(body.entries)
                return reply(200, {success: true})
            }
            case "list": {
                const opRes = await this.storage.list({prefix: body.options.prefix})
                return reply(200, {success:true, result: Array.from(opRes.values())})
            }
            case "delete": {
                const opRes = await this.storage.delete(body.keys)
                return reply(200, {success: true})
            }
            default: return reply(400)
        }
    }
}