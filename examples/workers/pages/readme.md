# Example: Pages

Using [Pages](https://developers.cloudflare.com/pages/) with Worktop, you will need to use the [advanced mode](https://developers.cloudflare.com/pages/platform/functions#advanced-mode).

This is a demo, using snippets from a [previous Q&A](https://github.com/lukeed/worktop/issues/145).

There are a few ways to do this:

## Use the CF default export

If you want to only use Worktop for specific routes, e.g. `/api/*`, you can do something like this:

```ts
import { Router } from 'worktop';

const API = new Router;

API.add('GET', '/api/hello', async (req, context) => {
  return new Response('Example');
});

// ...

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
  
    // Check for a prefix and use API.run
    if (url.pathname.startsWith('/api/')) {
      ctx.bindings = env;
      return API.run(req, ctx);
    }
  
    // Use the default CF assets fallback
    return env.ASSETS.fetch(req);
  }
}
```

## Deploy a Module Worker via Worktop

You could also define a `GET /*` route as the last thing in Worktop:

```ts
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

// ...

// This will be the fallback route, for any routes not defined
API.add('GET', '/*', (req, context) => {
  return context.bindings.ASSETS.fetch(req);
});

// Initialize the Module Worker
export default cfw.start(API.run);
```

## Using Router.mount

You could separate things out into subrouters.

Define the `ASSETS` binding:

```ts
// file: lib/types.ts
import type { Durable } from 'worktop/cfw.durable';

export type Context = import('worktop').Context & {
  bindings: {
    ASSETS: Durable.Namespace;
  };
}
```

Define a router for the `/api/*` routes:

```ts
// file: lib/router.api.ts
import { Router } from 'worktop';
import type { Context } from './types';

export const API = new Router<Context>();

API.add('GET', '/hello', () => new Response('GET /api/hello'));
API.add('GET', '/world', () => new Response('GET /api/world'));
```

Then, in the main, using `Router.mount` to set up subrouters:

```ts
// file: lib/router.main.ts
import { Router } from 'worktop';
import * as cfw from 'worktop/cfw';    
import { API } from './router.api';

import type { Context } from './types';

const MAIN = new Router<Context>();

// All "/api/*" requests to the API subrouter
MAIN.mount('/api/', API);

// Everything else is forwarded to the `env.ASSETS` binding
MAIN.add('GET', '*', (req, context) => {
  return context.bindings.ASSETS.fetch(req);
});

// Initialize the Module Worker
export default cfw.start(MAIN.run);
```

## License

MIT
