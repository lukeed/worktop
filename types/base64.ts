import * as Base64 from 'worktop/base64';

assert<string>(Base64.encode('asd'));
assert<string>(Base64.base64url('asd'));
assert<string>(Base64.decode('asd'));

// @ts-expect-error
Base64.encode(12345);

// @ts-expect-error
Base64.encode(new Uint8Array);
