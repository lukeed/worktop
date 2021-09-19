/**
 * String to ArrayBuffer
 * @encoding "binary"
 */
export function encode(input: string): Uint8Array {
	let i=0, len=input.length;
	let view = new Uint8Array(len);

	for (; i < len; i++) {
		view[i] = input.charCodeAt(i);
	}

	return view;
}

/**
 * ArrayBuffer to string
 * @encoding "binary"
 */
export function decode(buffer: ArrayBuffer): string {
	// @ts-ignore (native) ArrayLike<number[]> vs number[]
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
}
