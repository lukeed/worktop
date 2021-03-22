import { encode, toHEX } from 'worktop/utils';

export function digest(algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', message: string): Promise<string> {
	return crypto.subtle.digest(algo, encode(message)).then(toHEX);
}
