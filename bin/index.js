const swc = require('@swc/core');
const { builtinModules } = require('node:module');
const { writeFileSync } = require('node:fs');
const pkg = require('../package.json');

async function bundle(path, isESM) {
	let start = Date.now();
	let format = isESM ? 'es6' : 'commonjs';

	/** @type {swc.Options} */
	let config = {
		minify: true,
		module: {
			strict: true,
			noInterop: true,
			strictMode: false,
			type: format,
		},
		jsc: {
			loose: true,
			target: 'es2021',
			parser: {
				syntax: 'typescript'
			}
		},
	};

	let bun = await swc.bundle({
		target: 'node',
		output: { path },
		mode: 'production',
		entry: 'src/index.ts',
		options: config,
		module: {
			// ignored
			type: format,
		},
		externalModules: [
			...builtinModules,
			...Object.keys(pkg.dependencies),
		],
	});

	let k, result;
	for (k in bun) {
		result = bun[k];
		break;
	}

	// Needs another pass for module format change
	let output = isESM ? result : await swc.transform(result.code, config);

	let ms = Date.now() - start;
	writeFileSync(path, output.code);
	console.log('~> built "%s" in %dms', path, ms);
}

(async function () {
	await bundle(pkg.main, false);
	await bundle(pkg.module, true);
})().catch(err => {
	console.error('ERROR', err.stack || err);
	process.exitCode = 1;
});
