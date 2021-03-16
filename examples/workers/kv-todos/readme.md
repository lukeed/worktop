# Example: Todos KV

> **Note** No playground link because this example relies on a [KV Namespace](https://developers.cloudflare.com/workers/learning/how-kv-works).

Defines a `/users/:username/todo` resource controller, storing all records inside a KV namespace:

* `GET /users/:username/todos` – lists all `Todo` records for the `:username`  owner
* `POST /users/:username/todos` – creates a new `Todo` record for the `:username` owner
* `GET /users/:username/todos/:uid` – retrieves a single `Todo` record, identified by the `:username`::`:uid` pairing
* `PUT /users/:username/todos/:uid` – updates a `Todo` record with new values, identified by the `:username`::`:uid` pairing
* `DELETE /users/:username/todos/:uid` – deletes a `Todo` record, identified by the `:username`::`:uid` pairing

> **Important:** This is for **demonstration purposes only**! In order to be production-ready, it needs:
> * Authentication / Authorization <br>_Currently, any `:username` value is accepted... and by anybody._
> * Proper input validation <br>_Currently, only the `input.title` value is checked for a truthy-ness._
> * Stricter `uid` rules / route validation <br>_Ideally you'd validate route-params like `uid` to protect against unnecessary KV interactions._

## License

MIT
