import * as buffer from 'worktop/buffer';

/**
 * HEX
 */

// @ts-expect-error
HEX.push('hello', 'world');

// @ts-expect-error
HEX[10] = 'cannot do this';

assert<readonly string[]>(buffer.HEX);
