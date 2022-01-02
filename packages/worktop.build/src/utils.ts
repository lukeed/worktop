import type { Options } from 'worktop.build';
import type { Platform, Format } from 'worktop.build';

export namespace Narrow {
	export type Platform = 'cfw' | 'web' | 'node' | 'deno';
	export type Format = 'function' | 'esm' | 'lambda' | 'cjs' | 'sw';
	export type Combo = { env: Platform; format: Format }
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

export function toCombo(options: Options): Narrow.Combo {
	let env = toEnv(options.env);
	let format = toFormat(env, options.format);
	return { env, format };
}
