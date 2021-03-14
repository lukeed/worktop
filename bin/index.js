import * as fs from 'fs';
import { build } from 'esbuild';
import { parse, format } from 'path';
import { createRequire } from 'module';

// @ts-ignore
const pkg = createRequire(import.meta.url)('../package.json');

const externals = [
	'worktop',
	'worktop/cache',
	...Object.keys(pkg.dependencies)
]

/**
 * @param {string} input
 * @param {string} output
 */
async function bundle(input, output) {
	await build({
		bundle: true,
		format: 'esm',
		outfile: output,
		entryPoints: [input],
		external: externals,
		treeShaking: true,
		target: 'esnext',
		charset: 'utf8',
		sourcemap: false,
		minifySyntax: true,
		minifyIdentifiers: true,
		logLevel: 'info', // summary
	});

	let dts = input.replace(/\.[mc]?[tj]s$/, '.d.ts');
	if (!fs.existsSync(dts)) return console.warn('Missing "%s" file!', dts);

	let info = parse(input);
	info.base = 'index.d.ts';
	info.dir = info.name;

	fs.copyFileSync(dts, format(info));
}

/**
 * init
 */
bundle('src/index.js', pkg.exports['.']);
bundle('src/cache.js', pkg.exports['./cache']);
