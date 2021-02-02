const pkg = require('./package.json');

/**
 * @param {string} file
 * @param {'esm' | 'cjs'} format
 * @returns {import('rollup').OutputOptions}
 */
const make = (file, format) => ({
	file, format,
	sourcemap: false,
	esModule: false,
	interop: false,
	strict: false
});

module.exports = {
	input: 'src/index.js',
	output: [
		make(pkg.exports['.'].import, 'esm'),
		make(pkg.exports['.'].require, 'cjs'),
	],
	external: [
		...Object.keys(pkg.dependencies)
	],
	treeshake: {
		moduleSideEffects: false,
	}
}
