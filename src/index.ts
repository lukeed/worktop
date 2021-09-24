import type { BuildOptions } from 'esbuild';
import type { Options } from '../';

let esbuild: typeof import('esbuild');

// TODO: validate --format and/or --platform combination
export async function build(options: Options): Promise<void> {
	esbuild = esbuild || await import('esbuild');

	let { platform, sourcemap, external=[] } = options;
	let fields = ['worker', 'browser', 'module', 'jsnext', 'main'];
	let conds = ['worker', 'browser', 'import', 'production', 'default'];

	let config: BuildOptions = {
		bundle: true,
		splitting: false,
		outfile: options.output,
		entryPoints: [options.input],
		format: options.format || 'esm',
		target: options.target || 'esnext',
		sourcemap: sourcemap ? 'inline' : false,
		resolveExtensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.json', '.htm', '.html'],
		external: ([] as string[]).concat(external),
		logLevel: options.loglevel || 'info',
		minify: !!options.minify,
		mainFields: fields,
		conditions: conds,
		charset: 'utf8',
		loader: {
			'.htm': 'text',
			'.html': 'text',
		}
	};

	if (platform === 'node') {
		fields = fields.slice(2);
		conds = ['node', 'require', ...conds.slice(2)];
	}

	if (options.modify) {
		options.modify(config);
	} else if (options.overrides) {
		Object.assign(config, options.overrides);
	}

	config.write = true;

	if (options.analyze) {
		config.metafile = true;
	}

	let result = await esbuild.build(config);

	if (options.analyze) {
		console.log(
			await esbuild.analyzeMetafile(result.metafile!, {
				verbose: /^(debug|verb)$/i.test(config.logLevel!),
				color: true,
			})
		);
	}
}
