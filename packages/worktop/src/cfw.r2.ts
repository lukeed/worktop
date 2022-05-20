import { R2 } from 'worktop/cfw.r2';

export async function * list<M extends R2.Metadata.Custom>(
	binding: R2.Bucket,
	options?: R2.Options.List
): AsyncGenerator<{ done: boolean; objects: R2.Object.Metadata<M>[] }> {
	options = options || {}
	let cursor = options.cursor;

	while (true) {
		options.cursor = cursor;
		let results = await binding.list<M>(options);
		let isDone = !results.cursor && !results.truncated;
		cursor = results.cursor;

		yield {
			objects: results.objects,
			done: isDone,
		};

		if (isDone) return;
	}
}

export async function paginate<M extends R2.Metadata.Custom>(
	binding: R2.Bucket,
	options?: R2.Options.List & {
		page?: number;
		limit?: number;
	}
): Promise<R2.Object.Metadata<M>[]> {
	let { limit=50, page=1, ...rest } = options || {};
	let pager = list<M>(binding, rest);

	for await (let result of pager) {
		// page target exceeds total
		if (--page && result.done) return [];
		else if (page === 0) return result.objects;
	}

	return [];
}
