const Magic = require('magic-string').default;
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
	},
	plugins: [
		comments()
	]
}

/** @returns {import('rollup').Plugin} */
function comments(options={}) {
	return {
		name: 'comments',
		transform(code, id) {
			const comments = [];

			// @ts-ignore https://github.com/Rich-Harris/magic-string/pull/183
			const file = new Magic(code, { filename: id });

			this.parse(code, {
				ecmaVersion: 10,
				sourceType: 'module',
				onComment: comments,
			});

			// TODO: preserve "PURE" annotations
			for (let i=0, tmp; i < comments.length; i++) {
				tmp = comments[i];
				file.remove(tmp.start, tmp.end).trim();
			}

			return file.trimLines().toString().replace(/(\r?\n){2,}/g, '\n');
		}
	}
}
