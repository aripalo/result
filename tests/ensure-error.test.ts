import ensureError from "../src/ensure-error";

describe("ensureError", () => {
	test("wraps non-Error input into a NonError", () => {
		const err = ensureError("not an error");
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("NonError");
		expect(err.message).toBe(JSON.stringify("not an error"));
	});

	test("wraps numeric input into a NonError", () => {
		const err = ensureError(42);
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("NonError");
		expect(err.message).toBe("42");
	});

	test("wraps null into a NonError", () => {
		const err = ensureError(null);
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("NonError");
	});

	test("wraps an object into a NonError", () => {
		const err = ensureError({ foo: "bar" });
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("NonError");
		expect(err.message).toBe('{"foo":"bar"}');
	});

	test("returns the same Error when given a normal Error", () => {
		const original = new Error("hello");
		const err = ensureError(original);
		expect(err).toBe(original);
		expect(err.name).toBe("Error");
		expect(err.message).toBe("hello");
		expect(typeof err.stack).toBe("string");
	});

	test("fills in a missing name", () => {
		const original = new Error("has message");
		Object.defineProperty(original, "name", {
			value: "",
			configurable: true,
			writable: true,
		});
		const err = ensureError(original);
		expect(err.name).toBe("Error");
	});

	test("falls back to 'Error' name when constructor name is empty", () => {
		const original = new Error("msg");
		Object.defineProperty(original, "name", {
			value: "",
			configurable: true,
			writable: true,
		});
		Object.defineProperty(original, "constructor", {
			value: undefined,
			configurable: true,
			writable: true,
		});
		const err = ensureError(original);
		expect(err.name).toBe("Error");
	});

	test("fills in a missing message", () => {
		const original = new Error();
		Object.defineProperty(original, "message", {
			value: "",
			configurable: true,
			writable: true,
		});
		const err = ensureError(original);
		expect(err.message).toBe("<No error message>");
	});

	test("fills in a missing stack and annotates it", () => {
		const original = new Error("stackless");
		Object.defineProperty(original, "stack", {
			value: "",
			configurable: true,
			writable: true,
		});
		const err = ensureError(original);
		expect(err.stack).toContain("<Original stack missing>");
	});

	test("falls back to empty string when the regenerated stack is also missing", () => {
		const original = new Error("stackless-twice");
		Object.defineProperty(original, "stack", {
			value: "",
			configurable: true,
			writable: true,
		});

		const OriginalError = globalThis.Error;
		function StacklessError(this: Error, message?: string) {
			const e = new OriginalError(message);
			Object.defineProperty(e, "stack", {
				value: "",
				configurable: true,
				writable: true,
			});
			return e;
		}
		StacklessError.prototype = OriginalError.prototype;

		(globalThis as unknown as { Error: unknown }).Error = StacklessError;
		try {
			const err = ensureError(original);
			expect(err.stack).toBe("");
		} finally {
			(globalThis as unknown as { Error: unknown }).Error = OriginalError;
		}
	});

	test("preserves a custom Error subclass's name and message", () => {
		class MyError extends Error {
			constructor(message: string) {
				super(message);
				this.name = "MyError";
			}
		}
		const original = new MyError("custom");
		const err = ensureError(original);
		expect(err).toBe(original);
		expect(err.name).toBe("MyError");
		expect(err.message).toBe("custom");
	});
});
