import type { Bindings, CronEvent, ModuleContext } from 'worktop';
import type { IncomingCloudflareProperties } from 'worktop';
import type { ModuleWorker } from 'worktop/modules';
import type { OmitIndex } from 'worktop/utils';
import type { KV } from 'worktop/kv';

/**
 * WORKTOP/MODULES
 */

const worker1: ModuleWorker = {
	async fetch(req, env, ctx) {
		assert<Request>(req);
		assert<IncomingCloudflareProperties>(req.cf);

		assert<Bindings>(env);

		assert<ModuleContext>(ctx);
		assert<Function>(ctx.waitUntil);
		assert<Function>(ctx.passThroughOnException);

		return new Response;
	},
	async scheduled(event, env, ctx) {
		// @ts-expect-error
		assert<CronEvent>(event);
		// @ts-expect-error - missing
		assert<undefined>(event.waitUntil);
		assert<Omit<CronEvent, 'waitUntil'>>(event);

		assert<string>(event.cron);
		assert<number>(event.scheduledTime);

		assert<Bindings>(env);

		assert<ModuleContext>(ctx);
		assert<Function>(ctx.waitUntil);
		// @ts-expect-error - missing
		assert<undefined>(ctx.passThroughOnException);
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
		assert<Request>(req);
		assert<ModuleContext>(ctx);
		assert<OmitIndex<CustomBindings>>(env);

		// @ts-expect-error - missing
		assert<undefined>(env.missing);
		assert<KV.Namespace>(env.DATAB);
		assert<string>(env.SECRET);
		assert<number>(env.COUNT);

		return new Response;
	}
}
