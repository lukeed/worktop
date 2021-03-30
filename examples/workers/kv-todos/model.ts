import * as DB from 'worktop/kv';
import { uid as toUID } from 'worktop/utils';
import type { UID } from 'worktop/utils';
import type { KV } from 'worktop/kv';

declare const TODOS: KV.Namespace;

export interface Todo {
	uid: UID<8>;
	title: string;
	done: boolean;
	created_at: number;
	updated_at: number|null;
}

const key_owner = (username: string) => `user::${username}::todos`;
const key_item = (username: string, uid: string) => `user::${username}::todos::${uid}`;

/**
 * Get the ID list for <username>
 */
export async function list(username: string): Promise<Todo['uid'][]> {
	const key = key_owner(username);
	return await DB.read<Todo['uid'][]>(TODOS, key, 'json') || [];
}

/**
 * Update the ID list for <username>
 */
export function sync(username: string, IDs: string[]) {
	const key = key_owner(username);
	return DB.write(TODOS, key, IDs);
}

/**
 * Force-write a `Todo` record
 */
export function save(username: string, item: Todo) {
	const key = key_item(username, item.uid);
	return DB.write(TODOS, key, item);
}

/**
 * Find a `Todo` record by its <username>::<uid> pair
 */
export function find(username: string, uid: string) {
	const key = key_item(username, uid);
	return DB.read<Todo>(TODOS, key, 'json');
}

/**
 * Create a new `Todo` record for <username>
 * - Ensures the `uid` value is unique to them
 * - Carefully picks value-keys for the record data
 * - Synchronizes owner's ID list for `GET /todos` route
 */
export async function insert(username: string, item: Partial<Todo>) {
	try {
		// Generate new UID
		const nextID = await DB.until(
			() => toUID(8), // 8 character string
			(x) => find(username, x), // check if unique for user
		);

		const values: Todo = {
			uid: nextID,
			title: item.title!, // validated in route
			done: !!item.done || false,
			created_at: Date.now(),
			updated_at: null
		};

		// exit early if could not save new `Todo` record
		if (!await save(username, values)) return;

		// synchronize the owner's `Todos`
		const IDs = (await list(username)).concat(nextID);
		if (!await sync(username, IDs)) return;

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
export async function update(username: string, item: Todo) {
	// Pick values explictly
	const values = {
		uid: item.uid,
		title: item.title.trim(),
		done: !!item.done,
		created_at: item.created_at,
		updated_at: Date.now()
	};

	const success = await save(username, values);
	return success && values;
}

/**
 * Remove an existing `Todo` record
 * - Synchronizes owner's ID list for `GET /todos` route
 */
export async function destroy(username: string, uid: string) {
	const key = key_item(username, uid);
	const success = await DB.remove(TODOS, key);
	if (!success) return false;

	const IDs = await list(username);
	for (let i=0; i < IDs.length; i++) {
		if (IDs[i] === uid) {
			IDs.splice(i, 1);
			break;
		}
	}

	return sync(username, IDs);
}
