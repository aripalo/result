# `@aripalo/result`

**Typesafe error handling (inspired by Go) and data absence protection for TypeScript applications (NodeJS or Browser).**

<br/>

> _“There are many like it, but this one is mine.”_

Writing asynchronous code with `async`/`await` looks simple, but once procedural code that depends on the output of previous async steps is being introduced with bit more complex error handling requirements, things start to become complex from control flow perspective. There are many good alternative solutions to this; This one just happens to be the solution I personally prefer:

1. Go-inspired, error as return value

2. Returned error is always an instance of `Error`

3. Return value (type `Maybe`) is a Tuple with either value or error present and the other always set to `null`:

   ```ts
   type Maybe<T> = [value: T, err: null] | [value: null, err: Error];
   ```

4. Data absence protection: By default, values that resolve to `undefined` or `null` will internally thrown an error, resulting into:

   ```ts
   [value: null, err: Error]
   ```

5. Primarily aimed for `async` functions and Promise objects, but works with synchronous functions too: Anything that is _throwable_, i.e. "can throw/reject".

6. Works both in NodeJS and Browser environments

<br/>

## Getting started

### Install

```sh
npm i @aripalo/result
```

### Example "throwable"

Some irrelevant code for demonstration purposes:

```ts
async function randomErrorHelloWorld(): Promise<string> {
  if (Math.random() < 0.5) {
    throw new Error("Random error occurred");
  }
  return "Hello World!";
}
```

### Usage

```ts
import Result from "@aripalo/result";

const [value, err] = await Result(randomErrorHelloWorld());

if (err) {
  assert(value === null); // true
  assert(err instanceof Error); // true
} else {
  assert(typeof value === "string"); // true
  assert(err === null); // true
}
```

<br/>

## Patterns

### Receive both

```ts
const [value, err] = await Result(randomErrorHelloWorld());

if (err) {
  // handle err, for example return early
  return;
}

// do something with the value
```

### Ignore value

If you're only interested in "did the operation succeed", without caring about the return value:

```ts
const [, err] = await Result(randomErrorHelloWorld());

if (err) {
  // handle err
}
```

### Ignore err

When you don't really care if the operation fails, but if it succeeded do something with the return value:

```ts
const [value] = await Result(randomErrorHelloWorld());

if (value) {
  // do something with value
}
```

### Disable data absence protection

If your _throwable_ returns/resolves without _meaningful_ data on success, you may specify `meaningful: false` to prevent the data absence protection:

```ts
const [value, err] = await Result(Promise.resolve(undefined), {
  meaningful: false,
});

if (err) {
  // handle err
} else {
  assert(typeof value === "undefined"); // true
}
```
