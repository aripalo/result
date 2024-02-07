import ensureError from "./ensure-error";

/**
 * Result return type. Tuple containing either `[value, null]` or `[null, err]`.
 */
export type Maybe<T> = [value: T, err: null] | [value: null, err: Error];

/**
 * Options to control the behavior of the Result utility.
 */
export interface ResultOptions
	extends Record<string, string | boolean | number | undefined> {
	/**
	 * @default true
	 */
	meaningful?: boolean;
}

/**
 * Default options for the Result utility.
 */
const defaultOptions: ResultOptions = {
	meaningful: true,
};

/**
 * Utility function to help with error handling and to ensure meaningful result.
 * Can receive any Promise-like (such as async function) or sync function, that
 * should return value, but can throw (reject).
 *
 * Somewhat inspired by Go's error handling (with err as last value):
 * Avoids try-catch blocks and makes it easier to handle errors in async code:
 * Always returns a tuple of `[value, err]` where either value or err is null.
 *
 * If `<Awaited<T>>value` resolves to null or undefined,
 * it is considered as "non-meaningful" result and an error is thrown.
 *
 * If `err` is not null, it is ensured to always be an instance of Error using
 * [ensure-error](https://github.com/sindresorhus/ensure-error) library.
 *
 * @param throwable Any function that may throw (or reject if a Promise)
 * @returns Tuple containing either `[value, null]` or `[null, err]`
 * @author Ari Palo
 */
export async function Result<T extends Promise<unknown> | unknown>(
	throwable: T,
	options: ResultOptions = {},
): Promise<Maybe<Awaited<T>>> {
	const opts = { ...defaultOptions, ...options };

	try {
		const value = await throwable; // await on non-Promise has no effect

		// As this utility is meant to ensure "meaningful" result,
		// we consider undefined and null as errors.
		if (opts.meaningful && (typeof value === "undefined" || value === null)) {
			throw new Error("Value is undefined or null");
		}

		return [value, null];
	} catch (errLike: unknown) {
		return [null, ensureError(errLike)];
	}
}

export default Result;
