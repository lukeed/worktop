export function digest(algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', message: string): Promise<string>;

export function SHA1(message: string): Promise<string>;
export function SHA256(message: string): Promise<string>;
export function SHA384(message: string): Promise<string>;
export function SHA512(message: string): Promise<string>;
