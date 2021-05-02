declare global {
	const WebSocketPair: {
		new(): {
			/** the `client` socket */
			0: WebSocket,
			/** the `server` socket */
			1: WebSocket,
		};
	};

	interface ResponseInit {
		webSocket?: WebSocket;
	}
}

export interface WebSocket {
	accept(): void;
	close(code?: number, reason?: string): void;

	// TODO: Check if ArrayBuffer / ReadableStream works
	send(data: number | string): void;

	addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}
