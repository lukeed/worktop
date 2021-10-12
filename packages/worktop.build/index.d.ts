import type { BuildOptions, LogLevel } from 'esbuild';

export type Platform = 'node' | 'browser' | 'cloudflare';

export interface Options {
	input: string;
	output: string;
	config?: string;
	/** @default "cloudflare" */
	platform?: Platform;
	/** @default "esnext" */
	target?: string | string[];
	/** @default "esm" */
	format?: 'esm' | 'cjs';
	/** @default false */
	sourcemap?: boolean;
	external?: string[];
	/** @default false */
	minify?: boolean;
	/** @default false */
	analyze?: boolean;
	/** @default "." */
	cwd?: string;
	/** @default "info" */
	loglevel?: LogLevel;
	overrides?: BuildOptions;
	modify?(config: BuildOptions): void;
}

export function define(options: Options): Options;
export function build(options: Options): Promise<void>;
