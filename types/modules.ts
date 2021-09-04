import type { Bindings } from 'worktop';
import type { ModuleWorker } from 'worktop/modules';
import type { IncomingCloudflareProperties } from 'worktop/request';
import type { KV } from 'worktop/kv';

/**
 * WORKTOP/MODULES
 */

 const worker1: ModuleWorker = {
	async fetch(req, env, ctx) {
		assert<Request>(req);
		assert<IncomingCloudflareProperties>(req.cf);

		assert<Bindings>(env);

		assert<Function>(ctx.waitUntil);
		assert<Function>(ctx.passThroughOnException);

		return new Response;
	},
	async scheduled(event, env, ctx) {
		// @ts-expect-error
		assert<CronEvent>(event);
		assert<string>(event.cron);
		assert<number>(event.scheduledTime);
		// @ts-expect-error
		assert<undefined>(event.waitUntil);
		assert<Function>(ctx.waitUntil);

		assert<Bindings>(env);
	}
};

interface CustomBindings extends Bindings {
	DATAB: KV.Namespace;
	SECRET: string;
	// @ts-expect-error
	COUNT: number;
}

const worker2: ModuleWorker<CustomBindings> = {
	fetch(req, env, ctx) {
		assert<CustomBindings>(env);

		assert<string>(env.SECRET);
		assert<KV.Namespace>(env.DATAB);
		assert<number>(env.COUNT);

		// @ts-expect-error
		assert<undefined>(env.missing);

		return new Response;
	}
}
