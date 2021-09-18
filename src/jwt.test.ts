import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as jwt from './jwt';

const API = suite('export');

API('exports', () => {
	assert.instance(jwt.INVALID, Error);
	assert.instance(jwt.EXPIRED, Error);

	assert.type(jwt.decode, 'function');

	assert.type(jwt.HS256, 'function');
	assert.type(jwt.HS384, 'function');
	assert.type(jwt.HS512, 'function');

	assert.type(jwt.RS256, 'function');
	assert.type(jwt.RS384, 'function');
	assert.type(jwt.RS512, 'function');
});

API.run();

// ---

const HS256 = suite('HS256');

HS256('should return a Factory object', () => {
	let ctx = jwt.HS256({ key: '123' });

	assert.type(ctx, 'object');
	assert.type(ctx.sign, 'function');
	assert.type(ctx.verify, 'function');
});

HS256('should sign a JWT input', async () => {
	let ctx = jwt.HS256({
		key: 'secret'
	});

	let token = await ctx.sign({
		iat: 1516239022,
		// @ts-ignore
		foo: 123
	});

	// note: confirm via jwt.io
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsImZvbyI6MTIzfQ.x-zNIj8_5JJF9BNJukHZXvc4fVnkQekXeBescZHdHSQ');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
			foo: 123,
		},
		signature: 'x-zNIj8_5JJF9BNJukHZXvc4fVnkQekXeBescZHdHSQ',
	});
});

HS256('should sign a JWT input :: expires', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		expires: 60 // secs
	});

	let token = await ctx.sign({
		iat: 1516239022,
		// @ts-ignore
		foo: 123,
		// "exp": 1516239082
	});

	// note: confirm via jwt.io
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsImZvbyI6MTIzLCJleHAiOjE1MTYyMzkwODJ9.uKaZ6aCePkVPVXoG2YaDZJkrmHbN2qecB6uW1GvXhNk');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
			foo: 123,
			exp: 1516239082,
		},
		signature: 'uKaZ6aCePkVPVXoG2YaDZJkrmHbN2qecB6uW1GvXhNk',
	});
});

HS256('should sign a JWT input :: expires :: respect "exp" key', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		expires: 60 // secs
	});

	let token = await ctx.sign({
		exp: 1600000000,
		iat: 1516239022,
		// @ts-ignore
		foo: 123,
	});

	// note: confirm via jwt.io
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsImlhdCI6MTUxNjIzOTAyMiwiZm9vIjoxMjN9.tpyF15WdHDvB7Sjtkq-8wAAro6buCPpApxXTN33lIA4');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			exp: 1600000000,
			iat: 1516239022,
			foo: 123,
		},
		signature: 'tpyF15WdHDvB7Sjtkq-8wAAro6buCPpApxXTN33lIA4',
	});
});

HS256('should sign a JWT input :: kid', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		kid: 'hello',
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImhlbGxvIn0.eyJpYXQiOjE1MTYyMzkwMjJ9._XmQIfxjpcau1gubu69xt5csWfSuDjL7StPWGEwpaec');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
			kid: 'hello',
		},
		payload: {
			iat: 1516239022
		},
		signature: '_XmQIfxjpcau1gubu69xt5csWfSuDjL7StPWGEwpaec',
	});
});

HS256('should sign a JWT input :: header claims', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		header: {
			foo: 123,
			bar: 456,
		},
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJmb28iOjEyMywiYmFyIjo0NTYsImFsZyI6IkhTMjU2IiwidHlwIjoiSldUIn0.eyJpYXQiOjE1MTYyMzkwMjJ9.suV0Ah7wahj83kWvHaF6M-ywaYVDj5y_BLSiR5gj2ic');

	assert.equal(jwt.decode(token), {
		header: {
			foo: 123,
			bar: 456,
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022
		},
		signature: 'suV0Ah7wahj83kWvHaF6M-ywaYVDj5y_BLSiR5gj2ic',
	});
});

// TODO: verify tests
// TODO: HS384,512 tests

HS256.run();

// ---

const HS384 = suite('HS384')

HS384('should return a Factory object', () => {
	let ctx = jwt.HS384({ key: '123' });

	assert.type(ctx, 'object');
	assert.type(ctx.sign, 'function');
	assert.type(ctx.verify, 'function');
});

HS384('should sign a JWT input', async () => {
	let ctx = jwt.HS384({
		key: 'secret'
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjJ9.WnlWt9KqH06xigxP92jhKyRCWQ57vWypiup9aYxRsi-vdNDGgV0acLy1NEd9UPlE');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS384',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
		},
		signature: 'WnlWt9KqH06xigxP92jhKyRCWQ57vWypiup9aYxRsi-vdNDGgV0acLy1NEd9UPlE',
	});
});

// TODO: verify
HS384.run();

// ---

const HS512 = suite('HS512')

HS512('should return a Factory object', () => {
	let ctx = jwt.HS512({ key: '123' });

	assert.type(ctx, 'object');
	assert.type(ctx.sign, 'function');
	assert.type(ctx.verify, 'function');
});

HS512('should sign a JWT input', async () => {
	let ctx = jwt.HS512({
		key: 'secret'
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjJ9.jT_u5LveCncCB1Mz8irCqntlwT7RGuczMsQvxGlQymALylceOtc1OaHlojhR74CsgrLfiJtWVLplnSx_XU8MzQ');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS512',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
		},
		signature: 'jT_u5LveCncCB1Mz8irCqntlwT7RGuczMsQvxGlQymALylceOtc1OaHlojhR74CsgrLfiJtWVLplnSx_XU8MzQ',
	});
});

// TODO: verify
HS512.run();

// ---

const RS256 = suite('RS256')

RS256('should return a Factory object', () => {
	let ctx = jwt.RS256({
		privkey: '',
		pubkey: '',
	});

	assert.type(ctx, 'object');
	assert.type(ctx.sign, 'function');
	assert.type(ctx.verify, 'function');
});

RS256('should sign a JWT input', async () => {
	let ctx = jwt.RS256({
		privkey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDowizjrc4us3A9\n7Jpcc2Aq7zgitEh4XSpoc+k4bokIPLWxXcgk2Iyx15UWdUM3bGpKmh1qnIjpDOun\n8SEWSAQec1pwnpw59VhdF0wfDALyb8sxAQlR4IJh/mj52MOHgonBn1qPz88tWk6Z\nG2lXV2aIPfQiisv/wzrir9pSKyUQnLu//LG3+X7rG0FKt7CKuSUKzhy23hFwI5Xq\napDDRXOb/M5Glp0fwPplcV17bP163bM0EDLVV9kuCBHgZdVwlzrHV2N30c4QPz14\nJ/ox+AEXkgDTQAcJOM+X1sjg/zGdyCMIfYtQKHCOD6aLr9ADqpQsgqC00t+qWDQX\nZMnoKycxAgMBAAECggEALzjv8wxY47Qvjjyxz5Zv2R4aET5q4pKiTzlPBI42eoeY\npEC+4azWlKFEo98MEVNLWFHerHnQNBoVOIgtGpBnV4c3PtiLIR4j/JUEslrVQTsJ\nqipH6gbm5PtA8Im4F8bV7ITIUpuKcKzc++aqD1iR2ovZO2XWABCrooCjhl6vASis\nPsjwues5juGfSfCGSDem/VnmLPdQwdLLTjAZyzMo70q6rI/F/4JA9yxO/T1KTPre\njUhVnGBVp8y4Fp+NP3XJGLM+nYtrYCO9svgHwThQgZcnFNTUBMo9JYOVxTEoLwek\nZ9H5J865KddAT4W46D7xpq1XH07eQ6U2ggshrt+NHQKBgQD7LAl5UwM87nCF+yhn\nheU3wrSSohCVQGio1UK/v5x5z3WztfB2k0/hSdlc9gZn9r714l+jfSWDoJuUNAvM\nCXJ1D9v6KvGH1sgOAXZTtAJ9Ib1ntaOrtHZ9awP7lI8pDkx5XaMlnf2uGSkt+Kqt\nKZSPq/mosrT316154IP2l8MIDQKBgQDtO4eGfU8ajIG35ZswdNADsVUJgjdIq8A8\n040F6ZY619m56VO61EWdS2AzvoaCrlDWLqBYfyl7VINBbVd+MJy01108JSj/GwTG\nOD7WTubr9wffLzhKEWj2MPLpURkwGU7hWDWnnCI4oP4XmTlQior3M0t2Xc/hEI2V\njjRvNvzOtQKBgDu44dvOSEPRskG5UYckCDe0/TisfmLuuLQEWWW8itlP4f3EMhQP\nvPulkqCPA0DvI8LVe8Yk+KmOo8+efHucd3GsPrMCSQHyqQjjgh4u/DSCtEWXo/4s\n38u8iWrljRDHDJoDEMreATbHVspOiU65R1DOJIPfUjZoOyByqQ4WUdJ1AoGBAOZC\nwKGmYTBYrtPK9d2LlBfxeKOZE4Xixt2DTL8vYZTNy9PqiE2wGb252q9+v1p6TZYG\nfbZH/wBpIFlSAvlFv+S7oRBu1SL/m5u2Hi+vN+5SwP48+/rQeTt0eWJDSBpqhiit\nkK6WGpUylk5bd8kYIBgeXqGOHubKRVKjS3ujOLB9AoGAN22NQaoCHQbEcDDZUkce\nDD61Y1Q5iIlgzQv+lhobnXJJXYvmLffC8CVqGxU+jkm4+ogaK/7DQneWus1EjpoG\nseXY6tNuyp1RKKGW9aZbbI/SLWrvz+irdxgFX8Y45Ms9Mlzp5P2ixaRYI3SJJSv9\nrEmDzIuJyVuZWb8UrFbANdQ=\n-----END PRIVATE KEY-----',
		pubkey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6MIs463OLrNwPeyaXHNg\nKu84IrRIeF0qaHPpOG6JCDy1sV3IJNiMsdeVFnVDN2xqSpodapyI6Qzrp/EhFkgE\nHnNacJ6cOfVYXRdMHwwC8m/LMQEJUeCCYf5o+djDh4KJwZ9aj8/PLVpOmRtpV1dm\niD30IorL/8M64q/aUislEJy7v/yxt/l+6xtBSrewirklCs4ctt4RcCOV6mqQw0Vz\nm/zORpadH8D6ZXFde2z9et2zNBAy1VfZLggR4GXVcJc6x1djd9HOED89eCf6MfgB\nF5IA00AHCTjPl9bI4P8xncgjCH2LUChwjg+mi6/QA6qULIKgtNLfqlg0F2TJ6Csn\nMQIDAQAB\n-----END PUBLIC KEY-----',
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjJ9.S5Ap_Bq-a4elbpIfmLiEER8jlkbjl8FgEyxHtgsq1ukRdHvKXt6zeR0h3zo0k4APCEky7VAyF9vaUZl7c-8iJ35Sk8z5w8hXCrf7-s7kEw6t9_ypNjZjst36JhOkrBw1SPQv3Dh9Ekjbqem5zywAhCAeynvRawk9vx6vXKFgyNQQCjRniPbAab8prk75M2zSA9DIMiDwb33ywFF-TP89vHuZhF_ekiA_M03Gw-Tgq0REx7i3NlKQw6YIfO3J3H1GNShoytD2ln45qo4FnfWXUxRxmEWpP6ZQrLHUC9EPay9ollPMQqWfB3oBAw1bIrZc0_glWpNBPl1UaQq0mRhzqg');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'RS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
		},
		signature: 'S5Ap_Bq-a4elbpIfmLiEER8jlkbjl8FgEyxHtgsq1ukRdHvKXt6zeR0h3zo0k4APCEky7VAyF9vaUZl7c-8iJ35Sk8z5w8hXCrf7-s7kEw6t9_ypNjZjst36JhOkrBw1SPQv3Dh9Ekjbqem5zywAhCAeynvRawk9vx6vXKFgyNQQCjRniPbAab8prk75M2zSA9DIMiDwb33ywFF-TP89vHuZhF_ekiA_M03Gw-Tgq0REx7i3NlKQw6YIfO3J3H1GNShoytD2ln45qo4FnfWXUxRxmEWpP6ZQrLHUC9EPay9ollPMQqWfB3oBAw1bIrZc0_glWpNBPl1UaQq0mRhzqg',
	});
});

// TODO: verify
RS256.run();
