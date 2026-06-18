import result, { Result, result as namedResult } from "../src/index";

describe("result", () => {
	test("exposes the same function as default and named export", () => {
		expect(result).toBe(namedResult);
	});

	test("exposes the deprecated `Result` alias pointing to the same function", () => {
		expect(Result).toBe(result);
	});

	describe("synchronous inputs", () => {
		test("returns [value, null] for a plain value", async () => {
			const [value, err] = await result(42);
			expect(value).toBe(42);
			expect(err).toBeNull();
		});

		test("returns [value, null] for a sync function's return (already-invoked)", async () => {
			const [value, err] = await result((() => "hello")());
			expect(value).toBe("hello");
			expect(err).toBeNull();
		});

		test("returns [null, err] when a sync function throws (when invoked before passing)", async () => {
			let caught: unknown;
			try {
				(() => {
					throw new Error("sync boom");
				})();
			} catch (e) {
				caught = e;
			}
			// Result itself receives values, but it must also handle throwables passed
			// as already-rejected promises. Verify with a rejected promise wrapper:
			const [value, err] = await result(Promise.reject(caught));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.message).toBe("sync boom");
		});
	});

	describe("promise inputs", () => {
		test("returns [value, null] for a resolved promise", async () => {
			const [value, err] = await result(Promise.resolve("ok"));
			expect(value).toBe("ok");
			expect(err).toBeNull();
		});

		test("returns [null, err] for a rejected promise with Error", async () => {
			const [value, err] = await result(Promise.reject(new Error("nope")));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.message).toBe("nope");
		});

		test("wraps non-Error rejection reasons into an Error (NonError)", async () => {
			const [value, err] = await result(Promise.reject("string reason"));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
		});
	});

	describe("async function inputs (via returned promise)", () => {
		test("handles a resolved async function", async () => {
			const fn = async () => 7;
			const [value, err] = await result(fn());
			expect(value).toBe(7);
			expect(err).toBeNull();
		});

		test("handles a throwing async function", async () => {
			const fn = async () => {
				throw new Error("async boom");
			};
			const [value, err] = await result(fn());
			expect(value).toBeNull();
			expect(err?.message).toBe("async boom");
		});
	});

	describe("thenable inputs", () => {
		test("resolves a custom thenable", async () => {
			const thenable = {
				then(resolve: (v: string) => void) {
					resolve("thenable-value");
				},
			};
			const [value, err] = await result(thenable);
			expect(value).toBe("thenable-value");
			expect(err).toBeNull();
		});

		test("rejects a custom thenable", async () => {
			const thenable = {
				then(_: unknown, reject: (e: unknown) => void) {
					reject(new Error("thenable fail"));
				},
			};
			const [value, err] = await result(thenable);
			expect(value).toBeNull();
			expect(err?.message).toBe("thenable fail");
		});
	});

	describe("meaningful option (default true)", () => {
		test("treats undefined as an error by default", async () => {
			const [value, err] = await result(Promise.resolve(undefined));
			expect(value).toBeNull();
			expect(err?.message).toBe("Value is undefined or null");
		});

		test("treats null as an error by default", async () => {
			const [value, err] = await result(Promise.resolve(null));
			expect(value).toBeNull();
			expect(err?.message).toBe("Value is undefined or null");
		});

		test("treats undefined as an error when meaningful: true explicitly", async () => {
			const [value, err] = await result(Promise.resolve(undefined), {
				meaningful: true,
			});
			expect(value).toBeNull();
			expect(err?.message).toBe("Value is undefined or null");
		});
	});

	describe("meaningful option (false)", () => {
		test("allows undefined when meaningful: false", async () => {
			const [value, err] = await result(Promise.resolve(undefined), {
				meaningful: false,
			});
			expect(value).toBeUndefined();
			expect(err).toBeNull();
		});

		test("allows null when meaningful: false", async () => {
			const [value, err] = await result(Promise.resolve(null), {
				meaningful: false,
			});
			expect(value).toBeNull();
			expect(err).toBeNull();
		});
	});

	describe("falsy but meaningful values", () => {
		test("allows 0 with default options", async () => {
			const [value, err] = await result(0);
			expect(value).toBe(0);
			expect(err).toBeNull();
		});

		test("allows empty string with default options", async () => {
			const [value, err] = await result("");
			expect(value).toBe("");
			expect(err).toBeNull();
		});

		test("allows false with default options", async () => {
			const [value, err] = await result(false);
			expect(value).toBe(false);
			expect(err).toBeNull();
		});

		test("allows NaN with default options", async () => {
			const [value, err] = await result(NaN);
			expect(value).toBeNaN();
			expect(err).toBeNull();
		});
	});

	describe("rejection with non-Error primitives", () => {
		test("wraps null rejection into a NonError", async () => {
			const [value, err] = await result(Promise.reject(null));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
			expect(err?.message).toBe("null");
		});

		test("wraps undefined rejection into a NonError", async () => {
			const [value, err] = await result(Promise.reject(undefined));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
			expect(err?.message).toBe("");
		});

		test("wraps 0 rejection into a NonError", async () => {
			const [value, err] = await result(Promise.reject(0));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
			expect(err?.message).toBe("0");
		});

		test("wraps empty string rejection into a NonError", async () => {
			const [value, err] = await result(Promise.reject(""));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
			expect(err?.message).toBe('""');
		});

		test("wraps false rejection into a NonError", async () => {
			const [value, err] = await result(Promise.reject(false));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
			expect(err?.message).toBe("false");
		});

		test("wraps array rejection into a NonError", async () => {
			const [value, err] = await result(Promise.reject([1, 2, 3]));
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(Error);
			expect(err?.name).toBe("NonError");
			expect(err?.message).toBe("[1,2,3]");
		});
	});

	describe("AggregateError", () => {
		test("passes AggregateError through with .errors intact", async () => {
			const inner = [new Error("a"), new Error("b")];
			const agg = new AggregateError(inner, "all failed");
			const [value, err] = await result(Promise.reject(agg));
			expect(value).toBeNull();
			expect(err).toBe(agg);
			expect((err as AggregateError).errors).toEqual(inner);
			expect(err?.message).toBe("all failed");
		});

		test("preserves AggregateError produced by Promise.any when all reject", async () => {
			const [value, err] = await result(
				Promise.any([
					Promise.reject(new Error("x")),
					Promise.reject(new Error("y")),
				]),
			);
			expect(value).toBeNull();
			expect(err).toBeInstanceOf(AggregateError);
			expect((err as AggregateError).errors).toHaveLength(2);
		});
	});

	describe("custom Error subclass with extra properties", () => {
		test("preserves own properties on the returned error", async () => {
			class HttpError extends Error {
				constructor(
					message: string,
					public status: number,
					public details: { url: string },
				) {
					super(message);
					this.name = "HttpError";
				}
			}
			const original = new HttpError("not found", 404, {
				url: "/missing",
			});
			const [value, err] = await result(Promise.reject(original));
			expect(value).toBeNull();
			expect(err).toBe(original);
			expect((err as HttpError).status).toBe(404);
			expect((err as HttpError).details).toEqual({ url: "/missing" });
			expect(err?.name).toBe("HttpError");
		});
	});
});
