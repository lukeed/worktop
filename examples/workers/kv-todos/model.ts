import * as DB from 'worktop/kv';
import { ulid } from 'worktop/utils';
import type { ULID } from 'worktop/utils';
import type { KV } from 'worktop/kv';
import type { Context } from 'worktop';

export interface Bindings extends Context {
  bindings: {
    TODOS: KV.Namespace
  }
}

export interface Todo {
	uid: ULID;
	title: string;
	complete: boolean;
	created_at: number;
	updated_at: number|null;
}

const toPrefix = (username: string): string => `user::${username}::todos::`;
const toKeyname = (username: string, uid: string): string => toPrefix(username) + uid;

/**
 * Get a list of Todo IDs for <username>
 */
export async function list(KV: KV.Namespace, username: string, options: { limit?: number; page?: number } = {}): Promise<string[]> {
	const prefix = toPrefix(username);
	const keys = await DB.paginate<string[]>(KV, { ...options, prefix });
	//    ^keys are the full KV key names
	// Remove the `prefix::` from each of them
	return keys.map(x => x.substring(prefix.length));
}

/**
 * Force-write a `Todo` record
 */
export function save(KV: KV.Namespace, username: string, item: Todo): Promise<boolean> {
	const key = toKeyname(username, item.uid);
	return DB.write(KV, key, item);
}

/**
 * Find a `Todo` record by its <username>::<uid> pair
 */
export function find(KV: KV.Namespace, username: string, uid: string): Promise<object | null> {
	const key = toKeyname(username, uid);
	return DB.read<Todo>(KV, key, 'json');
}

/**
 * Create a new `Todo` record for <username>
 * - Ensures the `uid` value is unique to them
 * - Carefully picks value-keys for the record data
 * - Synchronizes owner's ID list for `GET /todos` route
 */
export async function insert(KV: KV.Namespace, username: string, item: Partial<Todo>): Promise<void | object> {
	try {
		// Generate new UID
		const nextID = await DB.until(
			() => ulid(), // 8 character string
			(x) => find(KV, username, x), // check if unique for user
		);

		const values: Todo = {
			uid: nextID,
			title: item.title!, // validated in route
			complete: !!item.complete,
			created_at: Date.now(),
			updated_at: null
		};

		// exit early if could not save new `Todo` record
		if (!await save(KV, username, values)) return;

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
export async function update(KV: KV.Namespace, username: string, item: Todo): Promise<object | void> {
	// Pick values explictly
	const values = {
		uid: item.uid,
		title: item.title.trim(),
		complete: !!item.complete,
		created_at: item.created_at,
		updated_at: Date.now()
	};

	const success = await save(KV, username, values);
	if (success) return values;
}

/**
 * Remove an existing `Todo` record
 * - Synchronizes owner's ID list for `GET /todos` route
 */
export function destroy(KV: KV.Namespace, username: string, uid: string): Promise<boolean> {
	const key = toKeyname(username, uid);
	return DB.remove(KV, key);
}
