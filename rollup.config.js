import { minify } from 'terser';
import * as pkg from './package.json';

/** @type {import('rollup').RollupOptions} */
const commons = {
	external: [
		'worktop', 'worktop/cache',
		...Object.keys(pkg.dependencies)
	],
	treeshake: {
		moduleSideEffects: false,
	},
	plugins: [
		{
			name: 'terser',
			async renderChunk(code) {
				const output = await minify(code, {
					module: true,
					toplevel: true,
					sourceMap: false,
					mangle: true,
					compress: {
						ecma: 2020,
						inline: 0,
						drop_console: true,
						conditionals: false,
					},
					output: {
						beautify: true,
						comments: false,
						indent_level: 2,
						ecma: 2020,
					},
				});

				return {
					code: output.code,
					map: output.map
				};
			}
		}
	]
};

function bundle(input, output) {
	output = {
		file: output,
		format: 'esm',
		sourcemap: false,
		esModule: false,
		interop: false,
		strict: false
	};
	return { input, output, ...commons };
}

export default [
	bundle('src/index.js', pkg.exports['.']),
	bundle('src/cache.js', pkg.exports['./cache']),
]
