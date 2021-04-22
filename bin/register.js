const { transform } = require('./esbuild');

// Browser polys for Node.js
// TODO: Remove w/ Browser test runner
const POLYFILLS = `
	// worktop/cache
	globalThis.caches = { default: {} };

	// worktop/base64
	globalThis.btoa = (x) => Buffer.from(x).toString('base64');
	globalThis.atob = (x) => Buffer.from(x, 'base64').toString();
`;

const loadCJS = require.extensions['.js'];

/**
 * @param {string} extn
 * @param {import('esbuild').Loader} loader
 * @param {Partial<import('esbuild').TransformOptions>} options
 */
function loader(extn, loader, options={}) {
	require.extensions[extn] = function (Module, filename) {
		// @ts-ignore
		const pitch = Module._compile.bind(Module);

		// @ts-ignore
		Module._compile = source => {
			const { code, warnings } = transform(source, {
				sourcefile: filename,
				loader: loader,
				...options,
			});

			warnings.forEach(msg => {
				console.warn(`\nesbuild warning in ${filename}:`);
				console.warn(msg.location);
				console.warn(msg.text);
			});

			return pitch(code, filename);
		};

		loadCJS(Module, filename);
	}
}

loader('.mjs', 'js');
loader('.ts', 'ts', {
	banner: POLYFILLS
});
