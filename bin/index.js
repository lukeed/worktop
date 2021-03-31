const { parse, format } = require('path');
const { copyFileSync, existsSync } = require('fs');
const { save, table } = require('./format');
const pkg = require('../package.json');
const esbuild = require('./esbuild');

const externals = ['worktop', ...Object.keys(pkg.dependencies)];

/**
 * @param {string} input
 * @param {string} output
 */
async function bundle(input, output) {
	await esbuild.build(input, save(output), externals);

	let dts = input.replace(/\.[mc]?[tj]s$/, '.d.ts');
	if (!existsSync(dts)) return console.warn('Missing "%s" file!', dts),process.exitCode=1;

	let info = parse(input);
	info.base = 'index.d.ts';
	info.dir = info.name;
	copyFileSync(dts, save(format(info)));
}

/**
 * init
 */
Promise.all([
	bundle('src/router.ts', pkg.exports['.']),
	bundle('src/cache.ts', pkg.exports['./cache']),
	bundle('src/cookie.ts', pkg.exports['./cookie']),
	bundle('src/base64.ts', pkg.exports['./base64']),
	bundle('src/request.ts', pkg.exports['./request']),
	bundle('src/response.ts', pkg.exports['./response']),
	bundle('src/crypto.ts', pkg.exports['./crypto']),
	bundle('src/utils.ts', pkg.exports['./utils']),
	bundle('src/cors.ts', pkg.exports['./cors']),
	bundle('src/kv.ts', pkg.exports['./kv']),
]).then(table);
