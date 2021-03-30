# Worktop Examples

> WIP – more on the way~!

* **[`workers/basic`](/examples/workers/basic)**<br>_Quick start with two `GET` requests._
* **[`workers/kv-todos`](/examples/workers/kv-todos)**<br>_A RESTful resource endpoint, tied to a KV Namespace._

## Setup

All examples are managed by [`cfw`](https://github.com/lukeed/cfw) for their build and deploy phases, but you can easily use [`wrangler`](https://developers.cloudflare.com/workers/cli-wrangler) instead! However, instructions are intended for `cfw` use only.

***Installation***

> **Note:** You may skip this if you ran `pnpm install` from the project root.

```sh
$ pnpm install
# or
$ yarn install
# or
$ npm install
```

***Build***

> **Note:** Must be run from this (`/examples`) directory

```sh
$ pnpm run build
# or
$ yarn run build
# or
$ npm run build
```

***Deploy***

> **Important:** You must set up your `cfw` credentials and update all `workers/*/cfw.json` files.

```sh
$ pnpm run deploy
# or
$ yarn run deploy
# or
$ npm run deploy
```

## License

MIT
