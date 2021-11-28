import * as DB from 'worktop/kv';
import { ulid } from 'worktop/utils';

import type { ULID } from 'worktop/utils';
import type { KV } from 'worktop/kv';

export interface Todo {
	uid: ULID;
	title: string;
	complete: boolean;
	created_at: number;
	updated_at: number|null;
}

const toPrefix = (username: string) => `user::${username}::todos::`;
const toKeyname = (username: string, uid: string) => toPrefix(username) + uid;

/**
 * Get a list of Todo IDs for <username>
 */
export async function list(TODOS: KV.Namespace, username: string, options: { limit?: number; page?: number } = {}): Promise<string[]> {
	const prefix = toPrefix(username);
	const keys = await DB.paginate<string[]>(TODOS, { ...options, prefix });
	//    ^keys are the full KV key names
	// Remove the `prefix::` from each of them
	return keys.map(x => x.substring(prefix.length));
}

/**
 * Force-write a `Todo` record
 */
export function save(TODOS: KV.Namespace, username: string, item: Todo): Promise<boolean> {
	const key = toKeyname(username, item.uid);
	return DB.write(TODOS, key, item);
}

/**
 * Find a `Todo` record by its <username>::<uid> pair
 */
export function find(TODOS: KV.Namespace, username: string, uid: string): Promise<Todo|null> {
	const key = toKeyname(username, uid);
	return DB.read<Todo>(TODOS, key, 'json');
}

/**
 * Create a new `Todo` record for <username>
 * - Ensures the `uid` value is unique to them
 * - Carefully picks value-keys for the record data
 * - Synchronizes owner's ID list for `GET /todos` route
 */
export async function insert(TODOS: KV.Namespace, username: string, item: Partial<Todo>): Promise<Todo|void> {
	try {
		// Generate new UID
		const nextID = await DB.until(
			() => ulid(), // 8 character string
			(x) => find(TODOS, username, x), // check if unique for user
		);

		const values: Todo = {
			uid: nextID,
			title: item.title!, // validated in route
			complete: !!item.complete,
			created_at: Date.now(),
			updated_at: null
		};

		// exit early if could not save new `Todo` record
		if (!await save(TODOS, username, values)) return;

		// return the new item
		return values;
	} catch (err) {
		// void
	}
}

/**
 * Update an existing `Todo` record for <username>
 * - Carefully picks value-keys to be saved
 * - Ensures `updated_at` is touched
 */
export async function update(TODOS: KV.Namespace, username: string, item: Todo): Promise<Todo|void> {
	// Pick values explictly
	const values: Todo = {
		uid: item.uid,
		title: item.title.trim(),
		complete: !!item.complete,
		created_at: item.created_at,
		updated_at: Date.now()
	};

	const success = await save(TODOS, username, values);
	if (success) return values;
}

/**
 * Remove an existing `Todo` record
 * - Synchronizes owner's ID list for `GET /todos` route
 */
export function destroy(TODOS: KV.Namespace, username: string, uid: string): Promise<boolean> {
	const key = toKeyname(username, uid);
	return DB.remove(TODOS, key);
}
