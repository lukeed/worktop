import type { Platform, Format } from 'worktop.build';

interface Input {
	env?: Platform;
	format?: Format;
}

// Valid env|format combos
export type Options = {
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
};

export namespace Narrow {
	export type Platform = 'cfw' | 'web' | 'node' | 'deno';
	export type Format = 'function' | 'esm' | 'lambda' | 'cjs' | 'sw';
	export interface Pair {
		env: Platform;
		format: Format;
	}
}

export function toEnv(value?: Platform|string): Narrow.Platform {
	value = (value || '').trim().toLowerCase();

	if (!value || /cloudflare/.test(value)) return 'cfw';
	if (/browser/.test(value)) return 'web';

	if (/^(node|deno|web|cfw)$/.test(value)) return value as Narrow.Platform;
	throw new Error(`Invalid "${value}" platform`);
}

export function toFormat(env: Narrow.Platform, value?: Format|string): Narrow.Format {
	value = (value || '').trim().toLowerCase();

	// everything except "web" has "esm" default
	if (!value) return env === 'web' ? 'sw' : 'esm';

	// dedupe alias(es)
	if (/module/.test(value)) value = 'esm';

	// validate `format` per `env` target
	if (env === 'node' && /^(esm|cjs|function|lambda)$/.test(value)) return value as Narrow.Format;
	if (env === 'cfw' && /^(esm|cjs|sw)$/.test(value)) return value as Narrow.Format;
	if (env === 'deno' && value === 'esm') return 'esm';
	if (env === 'web' && value === 'sw') return 'sw';

	throw new Error(`Invalid "${value}" format for "${env}" target`);
}

export function normalize(input: Input): Narrow.Pair {
	let env = toEnv(input.env);
	let format = toFormat(env, input.format);
	return { env, format };
}
