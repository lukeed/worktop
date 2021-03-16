import { Router } from 'worktop';
import * as Todos from './routes';

const API = new Router();

/**
 * NOTE: Demo expects hard-coded ":username" value.
 */
API.add('GET', '/users/:username/todos', Todos.list);
API.add('POST', '/users/:username/todos', Todos.create);
API.add('GET', '/users/:username/todos/:uid', Todos.show);
API.add('PUT', '/users/:username/todos/:uid', Todos.update);
API.add('DELETE', '/users/:username/todos/:uid', Todos.destroy);

addEventListener('fetch', API.listen);
