import { Router } from 'worktop';
import * as cfw from 'worktop/cfw';

import type { Context } from 'worktop';
import type { Durable } from 'worktop/cfw.durable';

interface MyContext extends Context {
	bindings: {
		ASSETS: Durable.Namespace;
	};
}

const API = new Router<MyContext>();

API.add('GET', '/api/hello', async (req, context) => {
	return new Response('Example');
});

// Add other routes as needed...

// This will be the fallback route, for any routes not defined
API.add('GET', '/*', (req, context) => {
	return context.bindings.ASSETS.fetch(req);
});

// Initialize the Module Worker
export default cfw.start(API.run);
