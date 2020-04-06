## Usage

```ts
import { Router } from 'worktop';

const API = new Router();

API.add('GET', '/', (req, res) => {
	res.end('OK');
});

addEventListener('fetch', API.listen);
```
