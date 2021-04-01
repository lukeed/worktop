import type { Handler } from 'worktop';
import type { Config } from 'worktop/cors';
import type { ServerResponse } from 'worktop/response';

export const config: Config = {
	origin: '*',
	methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
	headers: [],
	expose: [],
};

// NOTE: Allow `credentials` + `origin:*` to error naturally. Must fix config.
// @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
export function headers(res: ServerResponse, options?: Partial<Config>, isPreflight?: boolean) {
	let opts = (options ? { ...config, ...options } : config) as Required<Config>;

	res.setHeader('Access-Control-Allow-Origin', opts.origin);
	if (opts.origin !== '*') res.headers.append('Vary', 'Origin');
	if (opts.credentials) res.setHeader('Access-Control-Allow-Credentials', 'true');
	if (opts.expose.length) res.setHeader('Access-Control-Expose-Headers', opts.expose);

	if (isPreflight) {
		if (opts.maxage != null) res.setHeader('Access-Control-Max-Age', opts.maxage);
		if (opts.methods.length) res.setHeader('Access-Control-Allow-Methods', opts.methods);
		if (opts.headers.length) res.setHeader('Access-Control-Allow-Headers', opts.headers);
	}
}

type Options = Omit<Config, 'origin'> & { origin?: boolean | string | RegExp };
export function preflight(options: Options = {}): Handler {
	let origin = (options.origin = options.origin || '*');
	let isStatic = typeof origin === 'string';

	return function (req, res) {
		let tmp: string | null;
		let isPreflight = req.method === 'OPTIONS';

		if (!isStatic) {
			tmp = req.headers.get('Origin') || '';
			// false -> "*"; true -> reflects; rgx -> reflect?
			options.origin = origin === true && tmp || origin instanceof RegExp && origin.test(tmp) && tmp || 'false';
		}

		headers(res, options as Config, isPreflight);

		if (isPreflight) {
			if (!options.headers) {
				tmp = req.headers.get('Access-Control-Request-Headers');
				if (tmp) res.setHeader('Access-Control-Allow-Headers', tmp);
				res.headers.append('Vary', 'Access-Control-Request-Headers'); // reflects
			}

			res.statusCode = 204;
			res.end(null);
		}
	};
}
