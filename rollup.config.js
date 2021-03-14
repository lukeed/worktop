const Magic = require('magic-string').default;
const pkg = require('./package.json');

const commons = {
	external: [
		'worktop', 'worktop/cache',
		...Object.keys(pkg.dependencies)
	],
	treeshake: {
		moduleSideEffects: false,
	},
	plugins: [
		comments()
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

module.exports = [
	bundle('src/index.js', pkg.exports['.']),
	bundle('src/cache.js', pkg.exports['./cache']),
]
