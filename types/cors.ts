import { compose } from 'worktop';
import * as CORS from 'worktop/cors';
import type { ServerRequest } from 'worktop/request';
import type { ServerResponse } from 'worktop/response';
import type { Router } from 'worktop';

declare const API: Router;
declare const request: ServerRequest;
declare const response: ServerResponse;

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
CORS.preflight(request, response);
CORS.preflight()(request, response);
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
  async (req, res) => {
		// @ts-expect-error
		req.params.foobar // is not defined
		assert<{ group: string; wild: string }>(req.params);
		assert<string>(req.params.group);
		assert<string>(req.params.wild);
  }
));
