# Example: Basic Module Worker

> This is the [`/basic`](/examples/basic) example, but as a Module Worker. <br>
> **Note:** The Cloudflare Playground does not support Module Workers at this time.

Defines two `GET` endpoints:
* `GET /` – displays a welcome message (public cache)
* `GET /greet/:name?` - displays a greeting, using the `:name` value, if provided, otherwise falls back to the `FALLBACK` binding, which holds the `"friend"` string.

## License

MIT
