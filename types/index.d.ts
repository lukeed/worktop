declare function assert<T>(value: T): void;

declare namespace Fixed {
	type String<N extends number> = { 0: string; length: N } & string;
}

declare interface Item {
	foo: string;
}
