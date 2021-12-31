import { Router } from 'worktop';
import * as Cache from 'worktop/cache';
import { start } from 'worktop/cfw';
import * as Todos from './routes';

import type { Context } from './types';

const API = new Router<Context>();

API.prepare = Cache.sync();

/**
 * NOTE: Demo expects hard-coded ":username" value.
 */
API.add('GET', '/users/:username/todos', Todos.list);
API.add('POST', '/users/:username/todos', Todos.create);
API.add('GET', '/users/:username/todos/:uid', Todos.show);
API.add('PUT', '/users/:username/todos/:uid', Todos.update);
API.add('DELETE', '/users/:username/todos/:uid', Todos.destroy);

// Module Worker
export default start(API.run);
