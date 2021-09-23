const swc = require('@swc/core');
const { writeFileSync } = require('fs');
const pkg = require('../package.json');

async function bundle(path, isESM) {
	let start = Date.now();
	let format = isESM ? 'es6' : 'commonjs';
	let bun = await swc.bundle({
		target: 'node',
		mode: 'production',
		entry: 'src/index.ts',
		output: { path },
	});

	let k, code;
	for (k in bun) {
		code = bun[k].code;
		break;
	}

	let output = await swc.transform(code, {
		minify: true,
		swcrc: true,
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
		}
	});

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
