<div align="center">
  <img src="logo.png" alt="worktop" height="220" />
</div>

<div align="center">
  <a href="https://npmjs.org/package/kleur">
    <img src="https://badgen.now.sh/npm/v/kleur" alt="version" />
  </a>
  <a href="https://github.com/lukeed/kleur/actions?query=workflow%3ACI">
    <img src="https://github.com/lukeed/kleur/workflows/CI/badge.svg?event=push" alt="CI" />
  </a>
  <a href="https://npmjs.org/package/kleur">
    <img src="https://badgen.now.sh/npm/dm/kleur" alt="downloads" />
  </a>
  <a href="https://packagephobia.now.sh/result?p=kleur">
    <img src="https://packagephobia.now.sh/badge?p=kleur" alt="install size" />
  </a>
</div>

<div align="center">TODO</div>

## Features

* TODO
* TODO
* TODO
* TODO

## Install

```
$ npm install --save worktop
```

## Usage

```ts
import { Router } from 'worktop';

const API = new Router();

API.add('GET', '/', (req, res) => {
	res.end('OK');
});

addEventListener('fetch', API.listen);
```

## License

MIT © [Luke Edwards](https://lukeed.com)
