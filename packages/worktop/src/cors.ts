import type { Handler } from 'worktop';
import type { Config } from 'worktop/cors';

export const config: Config = {
	origin: '*',
	methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
	headers: [],
	expose: [],
};

// NOTE: Allow `credentials` + `origin:*` to error naturally. Must fix config.
// @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
export function headers(res: Response, options?: Partial<Config>): Config {
	let opts = (options ? { ...config, ...options } : config) as Required<Config>;

	res.headers.set('Access-Control-Allow-Origin', opts.origin);
	if (opts.origin !== '*') res.headers.append('Vary', 'Origin');
	if (opts.credentials) res.headers.set('Access-Control-Allow-Credentials', 'true');
	if (opts.expose.length) res.headers.set('Access-Control-Expose-Headers', opts.expose);

	return opts;
}

type Options = Omit<Config, 'origin'> & { origin?: boolean | string | RegExp };
export function preflight(options: Options = {}): Handler {
	let origin = (options.origin = options.origin || '*');
	let isStatic = typeof origin === 'string';

	return function (req, context) {
		let tmp: string | null;

		if (!isStatic) {
			tmp = req.headers.get('Origin') || '';
			// false -> "*"; true -> reflects; rgx -> reflect?
			options.origin = origin === true && tmp || origin instanceof RegExp && origin.test(tmp) && tmp || 'false';
		}

		if (req.method === 'OPTIONS') {
			let res = new Response(null, { status: 204 });
			let c = headers(res, options as Config);

			if (c.headers!.length) {
				res.headers.set('Access-Control-Allow-Headers', c.headers!);
			} else {
				tmp = req.headers.get('Access-Control-Request-Headers');
				if (tmp) res.headers.set('Access-Control-Allow-Headers', tmp);
				res.headers.append('Vary', 'Access-Control-Request-Headers'); // reflects
			}

			if (c.maxage != null) res.headers.set('Access-Control-Max-Age', c.maxage);
			if (c.methods!.length) res.headers.set('Access-Control-Allow-Methods', c.methods!);

			return res;
		}

		context.defer(res => {
			headers(res, options as Config);
		});
	};
}
