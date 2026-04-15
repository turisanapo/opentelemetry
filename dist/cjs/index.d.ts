import { Elysia } from 'elysia';
import { type ContextManager, type Context, type SpanOptions, type Span, type Attributes, TraceAPI, TracerProvider } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
type OpenTeleMetryOptions = NonNullable<ConstructorParameters<typeof NodeSDK>[0]>;
/**
 * Initialize OpenTelemetry SDK
 *
 * For best practice, you should be using preload OpenTelemetry SDK if possible
 * however, this is a simple way to initialize OpenTelemetry SDK
 */
export interface ElysiaOpenTelemetryOptions extends OpenTeleMetryOptions {
    contextManager?: ContextManager;
    /**
     * Optional function to determine whether a given request should be traced.
     *
     * @param req - The incoming request object to evaluate.
     * @returns A boolean indicating whether tracing should be enabled for this request.
     */
    checkIfShouldTrace?: (req: Request) => boolean;
    /**
     * Redact `userinfo` and sensitive query values in `url.full` / `url.query`.
     * Omitted: default redaction. `false`: record raw URLs (may leak secrets in query or credentials).
     */
    spanUrlRedaction?: false | {
        stripCredentials?: boolean;
        sensitiveQueryParams?: string[];
    };
    /**
     * Record full request/response body content on spans.
     * `true`: record both request and response bodies.
     * `{ request: true }` or `{ response: true }`: record only one side.
     * Default: `false` (no body content recorded).
     */
    recordBody?: boolean | {
        request?: boolean;
        response?: boolean;
    };
    /**
     * HTTP header names (case-insensitive) to capture as span attributes.
     * Use `"*"` in either list to capture all headers (useful for dev/debugging; may include sensitive values).
     * Including `"cookie"` in `requestHeaders` also emits `http.request.cookie` when `context.cookie` exists.
     * Default: none (no headers recorded).
     */
    headersToSpanAttributes?: {
        requestHeaders?: string[];
        responseHeaders?: string[];
    };
}
export type ActiveSpanArgs<F extends (span: Span) => unknown = (span: Span) => unknown> = [name: string, fn: F] | [name: string, options: SpanOptions, fn: F] | [name: string, options: SpanOptions, context: Context, fn: F];
export declare const shouldStartNodeSDK: (provider: TracerProvider) => boolean;
export type Tracer = ReturnType<TraceAPI['getTracer']>;
export type StartSpan = Tracer['startSpan'];
export type StartActiveSpan = Tracer['startActiveSpan'];
export declare const contextKeySpan: unique symbol;
export declare const getTracer: () => ReturnType<TraceAPI["getTracer"]>;
export declare const startSpan: (name: string, options?: SpanOptions, context?: Context) => Span;
export declare const startActiveSpan: StartActiveSpan;
export declare const record: {
    <F extends (span: Span) => unknown>(name: string, fn: F): ReturnType<F>;
    <F extends (span: Span) => unknown>(name: string, options: SpanOptions, fn: F): ReturnType<F>;
    <F extends (span: Span) => unknown>(name: string, options: SpanOptions, context: Context, fn: F): ReturnType<F>;
};
export declare const getCurrentSpan: () => Span | undefined;
/**
 * Set attributes to the current span
 *
 * @returns boolean - whether the attributes are set or not
 */
export declare const setAttributes: (attributes: Attributes) => boolean;
export declare const opentelemetry: ({ serviceName, instrumentations, contextManager, checkIfShouldTrace, spanUrlRedaction, recordBody, headersToSpanAttributes, ...options }?: ElysiaOpenTelemetryOptions) => Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
export {};
