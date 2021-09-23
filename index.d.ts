import type { Output, JscTarget, ParserConfig } from '@swc/core';

export type { Output };

export interface Options {
	input: string;
	output: string;
	minify?: boolean;
	target?: JscTarget;
	sourcemap?: boolean;
	platform?: 'node' | 'browser';
	format?: 'esm' | 'cjs';
	parser?: ParserConfig;
	external?: string[];
}

export function build(options: Options): Promise<Output>;
