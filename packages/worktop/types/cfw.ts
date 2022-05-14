import type { IncomingCloudflareProperties } from 'worktop/cfw';
import type { Module, Bindings, CronEvent } from 'worktop/cfw';
import type { Strict } from 'worktop/utils';
import type { KV } from 'worktop/cfw.kv';

/**
 * WORKTOP/MODULES
 */

const worker1: Module.Worker = {
	fetch(req, env, ctx) {
		assert<Request>(req);
		assert<IncomingCloudflareProperties>(req.cf);

		assert<Bindings>(env);

		assert<Module.Context>(ctx);
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

		assert<Module.Context>(ctx);
		assert<Function>(ctx.waitUntil);
		// @ts-expect-error - missing
		assert<undefined>(ctx.passThroughOnException);
	}
};

interface CustomBindings extends Bindings {
	AUTH: Module.Service;
	DATAB: KV.Namespace;
	SECRET: string;
	// @ts-expect-error
	COUNT: number;
}

const worker2: Module.Worker<CustomBindings> = {
	async fetch(req, env, ctx) {
		assert<Request>(req);
		assert<Module.Context>(ctx);
		assert<Strict<CustomBindings>>(env);

		// @ts-expect-error - missing
		assert<undefined>(env.missing);
		assert<Module.Service>(env.AUTH);
		assert<KV.Namespace>(env.DATAB);
		assert<string>(env.SECRET);
		assert<number>(env.COUNT);

		env.AUTH.fetch(req);
		env.AUTH.fetch(req.url);

		let res = await env.AUTH.fetch('https://foobar.com', {
			method: 'POST',
			headers: req.headers,
		});

		let rewriter = new HTMLRewriter()
			.on('div', {
				element(tag) {
					tag.append('foobar');
					assert<HTMLRewriter.Element>(tag);
					tag.setAttribute('id', 'c'+crypto.randomUUID());
				},
				comments(tag) {
					assert<HTMLRewriter.Comment>(tag);
					tag.remove();
				},
			})
			.onDocument({
				end(tag) {
					assert<HTMLRewriter.DocumentEnd>(tag);
					tag.append('<!--extra-->');
				},
				doctype(tag) {
					assert<HTMLRewriter.Doctype>(tag);
				}
			});

		assert<HTMLRewriter>(rewriter);
		return rewriter.transform(res);
	}
}
