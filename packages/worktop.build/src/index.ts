import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import * as combos from '../../combos';

import type { BuildOptions } from 'esbuild';
import type { Options } from '../';

let esbuild: typeof import('esbuild');

// NOTE: prevent Rollup import() -> require()
async function load<T = any>(ident: string): Promise<T> {
	return Function('x', 'return import("file:///" + x)')(ident);
}

// TODO? custom config OR allow default set
// TODO? transform typescript config file w/o -r hook

export async function build(options: Options): Promise<void> {
	esbuild = esbuild || await import('esbuild');

	let cwd = resolve(options.cwd || '.');

	if (options.config) {
		let tmp, b, dir=cwd;
		let root = process.cwd();
		while (true) {
			tmp = join(dir, options.config);
			if (b = existsSync(tmp)) break;
			else if (dir === root) break;
			else dir = dirname(dir);
		}
		if (b) await load(tmp).then(m => {
			m = (m.default || m) as Options;
			Object.assign(options, m.config || m);
		});
	}

	// TODO: this can throw error; format it
	let { env, format } = combos.normalize(options);

	let { sourcemap, external=[] } = options;
	let fields = ['worker', 'browser', 'module', 'jsnext', 'main'];
	let conds = ['worker', 'browser', 'import', 'production', 'default'];

	let config: BuildOptions = {
		bundle: true,
		splitting: false,
		absWorkingDir: cwd,
		outfile: options.output,
		entryPoints: [options.input],
		target: options.target || 'esnext',
		// TODO: do function/lambda support esm?
		format: /(cjs|function|lambda)/.test(format) ? 'cjs' : 'esm',
		resolveExtensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.json', '.htm', '.html'],
		external: ([] as string[]).concat(external),
		sourcemap: sourcemap ? 'inline' : false,
		logLevel: options.loglevel || 'info',
		minify: !!options.minify,
		mainFields: fields,
		conditions: conds,
		charset: 'utf8',
		plugins: [],
		loader: {
			'.htm': 'text',
			'.html': 'text',
		}
	};

	if (env === 'node') {
		fields = fields.slice(2);
		conds = ['node', 'require', ...conds.slice(2)];
	}

	if (options.modify) {
		options.modify(config);
	} else if (options.overrides) {
		Object.assign(config, options.overrides);
	}

	// Must wait for overrides
	// ---
	if (config.format === 'cjs') {
		// Used `build/index.mjs` by default; ".js" is loose
		config.outfile = config.outfile!.replace(/\.mjs$/, '.js');
	} else if (env === 'cfw' && config.format === 'esm') {
		// Wrangler always sees ".js" as CommonJS by default
		config.outfile = config.outfile!.replace(/\.c?js$/, '.mjs');
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

export function define(config: Options): Options {
	return config;
}
