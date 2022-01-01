# Example: Basic Deno Worker

> **Important:** This is the same as the [`/basic`](/examples/workers/basic) example, except that `worktop/cache` module has been removed as Deno does not (currently) support the Cache API.

Defines two `GET` endpoints:
* `GET /` – displays a welcome message (public cache)
* `GET /greet/:name` - displays `Hello, <name>!` message, using the `:name` value provided (no cache)

## License

MIT
