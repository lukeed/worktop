import { compose } from 'worktop';
import * as CORS from 'worktop/cors';
import type { Router, Context } from 'worktop';

declare const API: Router;
declare const request: Request;
declare const response: Response;
declare const context: Context;

assert<CORS.Config>(CORS.config);
assert<string>(CORS.config.origin);
assert<string[]>(CORS.config.headers!);
assert<boolean>(CORS.config.credentials!);
assert<string[]>(CORS.config.methods!);
assert<string[]>(CORS.config.expose!);

assert<Function>(CORS.headers);
assert<Function>(CORS.preflight);

// @ts-expect-error
CORS.headers(request);
CORS.headers(response);

CORS.headers(response, {
	// @ts-expect-error
	origin: true
});

// @ts-expect-error
CORS.preflight(request, context);
CORS.preflight()(request, context);
CORS.preflight({ origin: true });

/**
 * ROUTER
 */

API.prepare = CORS.preflight({
	// ...
});

API.prepare = compose(
	CORS.preflight(),
	async (req, res) => {
		return new Response
	}
);

// does not lose `Params` information
API.add('GET', '/static/:group/*', compose(
  CORS.preflight({ maxage: 86400 }),
  async (req, context) => {
		// @ts-expect-error
		context.params.foobar // is not defined
		assert<{ group: string; '*': string }>(context.params);
		assert<string>(context.params.group);
		assert<string>(context.params['*']);
  }
));
