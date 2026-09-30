/**
 * Types for the untyped API layer (`src/api/*.js`).
 *
 * ## Why these are declared separately
 *
 * The API and util modules are plain `.js`, but every one of them is imported from
 * `.tsx` under `strict`. With no declaration file, TypeScript reports TS7016
 * ("implicitly has an 'any' type") at each import site — 23 errors across the app,
 * all one root cause. The declarations in `src/api/*.d.ts` and
 * `src/utiles/*.d.ts` exist to give those modules a typed surface.
 *
 * ## Why the return type is `any`
 *
 * `src/utiles/axios.js` installs a response interceptor that resolves with the
 * response **body** rather than the `AxiosResponse`:
 *
 *     HttpClient.interceptors.response.use((response) => response.data || null)
 *
 * So `HttpClient.get("/users")` resolves to the parsed body, and consumers read
 * fields straight off it (`res.fields`, `res.map(...)`) without touching `.data`.
 * That is correct at runtime. axios's own types, however, can only describe
 * `AxiosResponse`, and they cannot express an interceptor that rewrites the
 * resolved value — so anything inferred from the axios call is the wrong shape.
 *
 * This is why simply setting `allowJs: true` makes things *worse*: TypeScript
 * then infers the real (unwrapped) `Promise<AxiosResponse<...>>` from the axios
 * types and reports ~80 errors on code that is working correctly. Do not enable
 * it without first giving `HttpClient` a type whose methods resolve to the body.
 *
 * `ApiResult` therefore stands in for "the response body, not yet typed". It is
 * deliberately `any` so behaviour is unchanged: consumers keep exactly the
 * checking they had before.
 *
 * ## Migrating off this
 *
 * The real fix is to convert the API layer to TypeScript and type the client:
 *
 *     const HttpClient = axios.create({ ... }) as unknown as BodyClient;
 *
 * where `BodyClient` re-declares `get`/`post`/`put`/`patch`/`delete` as returning
 * `Promise<T>` for the body. Then replace `ApiResult` per endpoint as each module
 * is converted, and delete the matching `.d.ts`. The `.d.ts` files enumerate the
 * real method names, so a typo in an API call is already a compile error.
 */

/**
 * Resolves to the response BODY, per the interceptor. See the note above.
 *
 * `any` is deliberate and load-bearing: it reproduces exactly the type the
 * untyped `.js` API layer already had, so adding these declarations fixes TS7016
 * without changing what any consumer is allowed to do. Narrow it per endpoint as
 * the API layer is converted to TypeScript.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResult<T = any> = Promise<T>;

/** Request body for the API calls that send arbitrary JSON. */
export type ApiPayload = Record<string, unknown>;
