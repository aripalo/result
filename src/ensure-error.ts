// Derived from: https://github.com/sindresorhus/ensure-error
// but uses JSON.stringify instead of util.inspect for browser compatibility

class NonError extends Error {
	name = "NonError";

	constructor(message: unknown) {
		super(JSON.stringify(message));
	}
}

export default function ensureError(input: unknown) {
	if (!(input instanceof Error)) {
		return new NonError(input);
	}

	const error = input;

	if (!error.name) {
		Object.defineProperty(error, "name", {
			value: error.constructor?.name || "Error",
			configurable: true,
			writable: true,
		});
	}

	if (!error.message) {
		Object.defineProperty(error, "message", {
			value: "<No error message>",
			configurable: true,
			writable: true,
		});
	}

	if (!error.stack) {
		const newErr = new Error(error.message);

		newErr.stack = newErr.stack || "";

		Object.defineProperty(error, "stack", {
			value: newErr.stack.replace(/\n {4}at /, "\n<Original stack missing>$&"),
			configurable: true,
			writable: true,
		});
	}

	return error;
}
