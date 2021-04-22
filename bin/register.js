const { transform } = require('./esbuild');

const loadJS = require.extensions['.js'];

// Browser polys for Node.js
// TODO: Remove w/ Browser test runner
const POLYFILLS = `
	// worktop/cache
	globalThis.caches = { default: {} };

	// worktop/base64
	globalThis.btoa = (x) => Buffer.from(x).toString('base64');
	globalThis.atob = (x) => Buffer.from(x, 'base64').toString();
`;

require.extensions['.ts'] = function (Module, filename) {
	const pitch = Module._compile.bind(Module);

	Module._compile = source => {
		const { code, warnings } = transform(source, {
			sourcefile: filename,
			banner: POLYFILLS,
			loader: 'ts',
		});

		warnings.forEach(msg => {
			console.warn(`\nesbuild warning in ${filename}:`);
			console.warn(msg.location);
			console.warn(msg.text);
		});

		return pitch(code, filename);
	};

	loadJS(Module, filename);
}
