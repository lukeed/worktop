const { transform } = require('esbuild');
const { defineConfig } = require('rollup');
const pkg = require('./package.json');

module.exports = defineConfig({
	input: 'src/index.ts',
	output: [
		{
			format: 'esm',
			file: pkg.module,
			esModule: false,
			interop: false,
			strict: false,
		}, {
			format: 'cjs',
			file: pkg.main,
			esModule: false,
			interop: false,
			strict: false,
		}
	],
	external: [
		...Object.keys(pkg.dependencies),
		...require('module').builtinModules,
	],
	plugins: [{
		name: 'esbuild',
		async transform(code, id) {
			let result = await transform(code, {
				format: 'esm',
				sourcefile: id,
				target: 'es2020',
				minify: false,
				loader: 'ts',
			});

			return {
				code: result.code,
				map: result.map || null,
			};
		}
	}]
});
