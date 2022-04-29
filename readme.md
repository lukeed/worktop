<div align="center">
  <img src="logo.png" alt="worktop" width="620" />
</div>

<div align="center">
  <a href="https://npmjs.org/package/worktop">
    <img src="https://badgen.now.sh/npm/v/worktop" alt="version" />
  </a>
  <a href="https://github.com/lukeed/worktop/actions?query=workflow%3ACI">
    <img src="https://github.com/lukeed/worktop/workflows/CI/badge.svg?event=push" alt="CI" />
  </a>
  <a href="https://npmjs.org/package/worktop">
    <img src="https://badgen.now.sh/npm/dm/worktop" alt="downloads" />
  </a>
  <a href="https://packagephobia.now.sh/result?p=worktop">
    <img src="https://packagephobia.now.sh/badge?p=worktop" alt="install size" />
  </a>
</div>

<div align="center">The next generation web framework for Cloudflare Workers</div>

## Features

* Super [lightweight](https://npm.anvaka.com/#/view/2d/worktop)
* First-class TypeScript support
* Custom Middleware Support
* Well-organized submodules for à la carte functionality<sup>*</sup>
* Includes Router with support for pattern definitions
* Familiar Request-Response handler API
* Supports `async`/`await` handlers
* Fully treeshakable

> <sup>*</sup>_More to come!_

## Install

```
$ npm install --save worktop
```

## Usage

> Check out [`/examples`](/examples) for a list of working demos!

```ts
import { Router } from 'worktop';
import * as utils from 'worktop/utils';
import { reply } from 'worktop/response';

// Cloudflare-specific Submodules
import { start } from 'worktop/cfw';
import * as Cache from 'worktop/cfw.cache';
import { read, write } from 'worktop/cfw.kv';

import type { KV } from 'worktop/cfw.kv';
import type { Context } from 'worktop';

interface Bindings extends Context {
  bindings: {
    DATA: KV.Namespace
  }
}

interface Message {
  id: string;
  text: string;
  // ...
}

// Create new Router instance
const API = new Router<Bindings>();

// Any `prepare` logic runs 1st for every request, before routing
// ~> use `Cache` for request-matching, when permitted
// ~> store Response in `Cache`, when permitted
API.prepare = Cache.sync();

API.add('GET', '/messages/:id', async (req, context) => {
  // Pre-parsed `context.params` object
  const key = `messages::${context.params.id}`;

  // Assumes JSON (can override)
  const message = await read<Message>(context.bindings.DATA, key);

  // Smart `send` helper
  // ~> automatically stringifies JSON objects
  // ~> auto-sets `Content-Type` & `Content-Length` headers
  return reply(200, message, {
    'Cache-Control': 'public, max-age=60'
  });
});


API.add('POST', '/messages', async (req, context) => {
  try {
    // Smart `utils.body` helper
    // ~> parses JSON header as JSON
    // ~> parses form-like header as FormData, ...etc
    var input = await utils.body<Message>(req);
  } catch (err) {
    return reply(400, 'Error parsing request body');
  }

  if (!input || !input.text.trim()) {
    return reply(422, { text: 'required' });
  }

  const value: Message = {
    id: utils.uid(16),
    text: input.text.trim(),
    // ...
  };

  // Assumes JSON (can override)
  const key = `messages::${value.id}`;
  const success = await write<Message>(context.bindings.DATA, key, value);
  //    ^ boolean

  // Alias for `event.waitUntil`
  // ~> queues background task (does NOT delay response)
  context.waitUntil(
    fetch('https://.../logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json '},
      body: JSON.stringify({ success, value })
    })
  );

  if (success) return reply(201, value);
  return reply(500, 'Error creating record');
});


// Init: Module Worker
export default start(API.run);
```

## API

### Module: `worktop`

> [View `worktop` API documentation](/packages/worktop/src/index.d.ts)
<!-- > [View `worktop` API documentation](/docs/module.router.md) -->

The main module – concerned with routing. <br>This is core of most applications. Exports the [`Router`](/packages/worktop/src/index.d.ts#L62) class.

### Module: `worktop/cfw.kv`

> [View `worktop/cfw.kv` API documentation](/packages/worktop/src/cfw.kv.d.ts)
<!-- > [View `worktop/cfw.kv` API documentation](/docs/module.kv.md) -->

The `worktop/cfw.kv` submodule contains all classes and utilities related to [Workers KV](https://www.cloudflare.com/products/workers-kv/).

### Module: `worktop/cache`

> [View `worktop/cache` API documentation](/packages/worktop/src/cache.d.ts)
<!-- > [View `worktop/cache` API documentation](/docs/module.cache.md) -->

The `worktop/cache` submodule contains all utilities related to [Cloudflare's Cache](https://developers.cloudflare.com/workers/learning/how-the-cache-works).

### Module: `worktop/cfw.durable`

> [View `worktop/cfw.durable` API documentation](/packages/worktop/src/cfw.durable.d.ts)
<!-- > [View `worktop/cfw.durable` API documentation](/docs/module.cfw.durable.md) -->

The `worktop/cfw.durable` submodule includes native types for Cloudflare's [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects) as well as an `Actor` abstract class that provides a blueprint for authoring a Durable Object that handles WebSocket connections.

> **Note:** Durable Objects can only be used with the Module Worker format. You must integrate the `Router` with the `worktop/modules` submodule.

### Module: `worktop/cfw`

> [View `worktop/cfw` API documentation](/packages/worktop/src/cfw.d.ts)
<!-- > [View `worktop/cfw` API documentation](/docs/module.cfw.md) -->

The `worktop/cfw` submodule includes two utilities related to Cloudflare's Module Worker format. Most notably, it includes TypeScript annotations specific to Cloudflare's environment.

### Module: `worktop/response`

> [View `worktop/response` API documentation](/packages/worktop/src/response.d.ts)
<!-- > [View `worktop/response` API documentation](/docs/module.response.md) -->

The `worktop/response` submodule contains the [`ServerResponse`](/packages/worktop/src/response.d.ts#L20) class, which provides an interface similar to the [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) (aka, "response") object that Node.js provides.

> **Note:** This module is used internally and will (very likely) never be imported by your application.

### Module: `worktop/base64`

> [View `worktop/base64` API documentation](/packages/worktop/src/base64.d.ts)
<!-- > [View `worktop/base64` API documentation](/docs/module.base64.md) -->

The `worktop/base64` submodule contains a few utilities related to the [Base 64 encoding](https://tools.ietf.org/html/rfc4648#section-4).

### Module: `worktop/cookie`

> [View `worktop/cookie` API documentation](/packages/worktop/src/cookie.d.ts)
<!-- > [View `worktop/cookie` API documentation](/docs/module.cookie.md) -->

The `worktop/cookie` submodule contains `parse` and `stringify` utilities for dealing with cookie header(s).

### Module: `worktop/cors`

> [View `worktop/cors` API documentation](/packages/worktop/src/cors.d.ts)
<!-- > [View `worktop/cors` API documentation](/docs/module.cors.md) -->

The `worktop/cors` submodule offers utilities for dealing with [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) headers.

### Module: `worktop/crypto`

> [View `worktop/crypto` API documentation](/packages/worktop/src/crypto.d.ts)
<!-- > [View `worktop/crypto` API documentation](/docs/module.crypto.md) -->

The `worktop/crypto` submodule is a collection of cryptographic functionalities.

### Module: `worktop/utils`

> [View `worktop/utils` API documentation](/packages/worktop/src/utils.d.ts)
<!-- > [View `worktop/utils` API documentation](/docs/module.utils.md) -->

The `worktop/utils` submodule is a collection of standalone, general-purpose utilities that you may find useful. These may include – but are not limited to – hashing functions and unique identifier generators.

### Module: `worktop/cfw.ws`

> [View `worktop/cfw.ws` API documentation](/packages/worktop/src/cfw.ws.d.ts)
<!-- > [View `worktop/cfw.ws` API documentation](/docs/module.cfw.ws.md) -->

The `worktop/cfw.ws` submodule contains the [`WebSocket`](/packages/worktop/src/cfw.ws.d.ts#L11) class definition, as well as middleware handler for validating and/or setting up a [`SocketHandler`](/packages/worktop/src/cfw.ws.d.ts#L32) for the WebSocket connection.


## License

MIT © [Luke Edwards](https://lukeed.com)
