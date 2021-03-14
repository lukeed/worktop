const esbuild = require('esbuild');

/** @type {esbuild.CommonOptions} */
const options = {
	target: 'esnext',
	sourcemap: false,
	treeShaking: true,
	minifySyntax: true,
	minifyIdentifiers: true,
	logLevel: 'info', // summary
}

/**
 * @param {string} input
 * @param {string} output
 * @param {string[]} [externals]
 */
exports.build = function (input, output, externals=[]) {
	return esbuild.build({
		...options,
		bundle: true,
		format: 'esm',
		outfile: output,
		entryPoints: [input],
		external: externals,
	});
}
