const { parse, format } = require('path');
const { copyFileSync, existsSync, writeFileSync } = require('fs');
const { rewrite, save, table } = require('./format');
const pkg = require('../package.json');
const esbuild = require('./esbuild');

const externals = ['worktop', ...Object.keys(pkg.dependencies)];

/**
 * @param {string} input
 * @param {Record<'import'|'require', string>} files
 */
async function bundle(input, files) {
	await esbuild.build(input, save(files.import), externals);

	writeFileSync(
		save(files.require),
		rewrite(files.import)
	);

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
	bundle('src/sw.ts', pkg.exports['./sw']),
	bundle('src/cache.ts', pkg.exports['./cache']),
	bundle('src/cookie.ts', pkg.exports['./cookie']),
	bundle('src/base64.ts', pkg.exports['./base64']),
	bundle('src/response.ts', pkg.exports['./response']),
	bundle('src/modules.ts', pkg.exports['./modules']),
	bundle('src/crypto.ts', pkg.exports['./crypto']),
	bundle('src/utils.ts', pkg.exports['./utils']),
	bundle('src/cors.ts', pkg.exports['./cors']),
	bundle('src/kv.ts', pkg.exports['./kv']),
	bundle('src/ws.ts', pkg.exports['./ws']),
]).then(table);
