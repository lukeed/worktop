const { parse, format } = require('path');
const { copyFileSync, existsSync } = require('fs');
const pkg = require('../package.json');
const esbuild = require('./esbuild');

const externals = [
	'worktop',
	'worktop/cache',
	'worktop/response',
	...Object.keys(pkg.dependencies)
];

/**
 * @TODO print sizes
 * @param {string} input
 * @param {string} output
 */
async function bundle(input, output) {
	await esbuild.build(input, output, externals);

	let dts = input.replace(/\.[mc]?[tj]s$/, '.d.ts');
	if (!existsSync(dts)) return console.warn('Missing "%s" file!', dts),process.exitCode=1;

	let info = parse(input);
	info.base = 'index.d.ts';
	info.dir = info.name;

	copyFileSync(dts, format(info));
}

/**
 * init
 */
bundle('src/router.ts', pkg.exports['.']);
bundle('src/cache.ts', pkg.exports['./cache']);
bundle('src/response.ts', pkg.exports['./response']);
