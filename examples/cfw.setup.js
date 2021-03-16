/**
 * @NOTE
 *   This file is (temporarily) necessary
 *   for `cfw` to configure Rollup correctly.
 *   This would not be needed if using `wrangler`.
 */
/**
 * @param {*} config Rollup Config
 */
module.exports = function (config) {
	// Expect `index.ts` entry point
	config.input = config.input.replace(/\.js$/, '.ts');

	// Attach `typescript` Rollup plugin
	config.plugins.push(
		// @ts-ignore - ESM type definition
		require('rollup-plugin-typescript2')(),
	);
}
