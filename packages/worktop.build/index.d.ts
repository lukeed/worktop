import type { BuildOptions, LogLevel } from 'esbuild';

export type Platform =
	| 'cloudflare' | 'cfw'
	| 'browser' | 'web'
	| 'node' | 'deno';

export type Format =
	| 'module' | 'esm' // cfw
	| 'function' // gcp
	| 'lambda' // aws
	| 'cjs' // node
	| 'sw'; // cfw|web

// Valid env|format combos
type Combos = {
	env?: 'cloudflare' | 'cfw';
	/** @default "module / esm" */
	format?: 'module' | 'esm' | 'sw';
} | {
	env: 'browser' | 'web';
	format?: 'sw';
} | {
	env: 'deno';
	format?: 'esm';
} | {
	env: 'node';
		/** @default "esm" */
	format?: 'cjs' | 'esm' | 'function' | 'lambda';
}

export type Options = {
	input: string;
	output: string;
	/**
	 * Path to `worktop.build` configuration file
	 * @default "worktop.config.js"
	 */
	config?: string;
	/**
	 * Target runtime environment
	 * @default "cloudflare"
	 */
	env?: Platform;
	/**
	 * An output variant for the target`env`
	 * @default "module"
	 */
	format?: Format;
	/** @default "esnext" */
	target?: string | string[];
	/** @default false */
	sourcemap?: boolean;
	/** @default [] */
	external?: string[];
	/** @default false */
	minify?: boolean;
	/** @default false */
	analyze?: boolean;
	/** @default "." */
	cwd?: string;
	/** @default "info" */
	loglevel?: LogLevel;
	/**
	 * Directly override the final `esbuild` configuration options; runs last.
	 * @warn NOT VALIDATED! Hope you know what you're doing~!
	 */
	overrides?: BuildOptions;
	/**
	 * Mutate the final `esbuild` configuration options; runs last.
	 * @warn NOT VALIDATED! Hope you know what you're doing~!
	 */
	modify?(config: BuildOptions): void;
} & Combos;

export function define(options: Options): Options;
export function build(options: Options): Promise<void>;
