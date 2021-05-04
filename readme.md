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
import * as Cache from 'worktop/cache';
import { uid as toUID } from 'worktop/utils';
import { read, write } from 'worktop/kv';
import type { KV } from 'worktop/kv';

declare var DATA: KV.Namespace;

interface Message {
  id: string;
  text: string;
  // ...
}

// Initialize
const API = new Router();


API.add('GET', '/messages/:id', async (req, res) => {
  // Pre-parsed `req.params` object
  const key = `messages::${req.params.id}`;

  // Assumes JSON (can override)
  const message = await read<Message>(DATA, key);

  // Alter response headers directly
  res.setHeader('Cache-Control', 'public, max-age=60');

  // Smart `res.send()` helper
  // ~> automatically stringifies JSON objects
  // ~> auto-sets `Content-Type` & `Content-Length` headers
  res.send(200, message);
});


API.add('POST', '/messages', async (req, res) => {
  try {
    // Smart `req.body` helper
    // ~> parses JSON header as JSON
    // ~> parses form-like header as FormData, ...etc
    var input = await req.body<Message>();
  } catch (err) {
    return res.send(400, 'Error parsing request body');
  }

  if (!input || !input.text.trim()) {
    return res.send(422, { text: 'required' });
  }

  const value: Message = {
    id: toUID(16),
    text: input.text.trim(),
    // ...
  };

  // Assumes JSON (can override)
  const key = `messages::${value.id}`;
  const success = await write<Message>(DATA, key, value);
  //    ^ boolean

  // Alias for `event.waitUntil`
  // ~> queues background task (does NOT delay response)
  req.extend(
    fetch('https://.../logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json '},
      body: JSON.stringify({ success, value })
    })
  );

  if (success) res.send(201, value);
  else res.send(500, 'Error creating record');
});


API.add('GET', '/alive', (req, res) => {
  res.end('OK'); // Node.js-like `res.end`
});


// Attach "fetch" event handler
// ~> use `Cache` for request-matching, when permitted
// ~> store Response in `Cache`, when permitted
Cache.listen(API.run);
```

## API

### Module: `worktop`

> [View `worktop` API documentation](/src/router.d.ts)
<!-- > [View `worktop` API documentation](/docs/module.router.md) -->

The main module – concerned with routing. <br>This is core of most applications. Exports the [`Router`](/src/router.d.ts#L66) class.

### Module: `worktop/kv`

> [View `worktop/kv` API documentation](/src/kv.d.ts)
<!-- > [View `worktop/kv` API documentation](/docs/module.kv.md) -->

The `worktop/kv` submodule contains all classes and utilities related to [Workers KV](https://www.cloudflare.com/products/workers-kv/).

### Module: `worktop/cache`

> [View `worktop/cache` API documentation](/src/cache.d.ts)
<!-- > [View `worktop/cache` API documentation](/docs/module.cache.md) -->

The `worktop/cache` submodule contains all utilities related to [Cloudflare's Cache](https://developers.cloudflare.com/workers/learning/how-the-cache-works).

### Module: `worktop/request`

> [View `worktop/request` API documentation](/src/request.d.ts)
<!-- > [View `worktop/request` API documentation](/docs/module.request.md) -->

The `worktop/request` submodule contains the [`ServerRequest`](/src/request.d.ts#L117) class, which provides an interface similar to the request instance(s) found in most other Node.js frameworks.

> **Note:** This module is used internally and will (very likely) never be imported by your application.

### Module: `worktop/response`

> [View `worktop/response` API documentation](/src/response.d.ts)
<!-- > [View `worktop/response` API documentation](/docs/module.response.md) -->

The `worktop/response` submodule contains the [`ServerResponse`](/src/response.d.ts#L6) class, which provides an interface similar to the [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) (aka, "response") object that Node.js provides.

> **Note:** This module is used internally and will (very likely) never be imported by your application.

### Module: `worktop/base64`

> [View `worktop/base64` API documentation](/src/base64.d.ts)
<!-- > [View `worktop/base64` API documentation](/docs/module.base64.md) -->

The `worktop/base64` submodule contains a few utilities related to the [Base 64 encoding](https://tools.ietf.org/html/rfc4648#section-4).

### Module: `worktop/cookie`

> [View `worktop/cookie` API documentation](/src/cookie.d.ts)
<!-- > [View `worktop/cookie` API documentation](/docs/module.cookie.md) -->

The `worktop/cookie` submodule contains `parse` and `stringify` utilities for dealing with cookie header(s).

### Module: `worktop/cors`

> [View `worktop/cors` API documentation](/src/cors.d.ts)
<!-- > [View `worktop/cors` API documentation](/docs/module.cors.md) -->

The `worktop/cors` submodule offers utilities for dealing with [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) headers.

### Module: `worktop/crypto`

> [View `worktop/crypto` API documentation](/src/crypto.d.ts)
<!-- > [View `worktop/crypto` API documentation](/docs/module.crypto.md) -->

The `worktop/crypto` submodule is a collection of cryptographic functionalities.

### Module: `worktop/utils`

> [View `worktop/utils` API documentation](/src/utils.d.ts)
<!-- > [View `worktop/utils` API documentation](/docs/module.utils.md) -->

The `worktop/utils` submodule is a collection of standalone, general-purpose utilities that you may find useful. These may include – but are not limited to – hashing functions and unique identifier generators.

### Module: `worktop/ws`

> [View `worktop/ws` API documentation](/src/ws.d.ts)
<!-- > [View `worktop/ws` API documentation](/docs/module.ws.md) -->

The `worktop/ws` submodule contains the [`WebSocket`](/src/ws.d.ts#L18) and [`WebSocketPair`](/src/ws.d.ts#L4) class definitions, as well as two middleware handlers for validating and/or setting up a [`SocketHandler`](/src/ws.d.ts#L38) for the WebSocket connection.


## License

MIT © [Luke Edwards](https://lukeed.com)
