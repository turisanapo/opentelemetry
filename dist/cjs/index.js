"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  contextKeySpan: () => contextKeySpan,
  getCurrentSpan: () => getCurrentSpan,
  getTracer: () => getTracer,
  opentelemetry: () => opentelemetry,
  record: () => record,
  setAttributes: () => setAttributes,
  shouldStartNodeSDK: () => shouldStartNodeSDK,
  startActiveSpan: () => startActiveSpan,
  startSpan: () => startSpan
});
module.exports = __toCommonJS(index_exports);
var import_elysia = require("elysia");
var import_api = require("@opentelemetry/api");
var import_sdk_node = require("@opentelemetry/sdk-node");
var headerHasToJSON = typeof new Headers().toJSON === "function";
var toHeaderNameSet = (names) => new Set((names ?? []).map((name) => name.toLowerCase()));
var SENSITIVE_QUERY_KEYS = /* @__PURE__ */ new Set([
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "password",
  "passwd",
  "pwd",
  "secret",
  "client_secret",
  "api_key",
  "apikey",
  "api-key",
  "authorization",
  "credential",
  "credentials",
  "code",
  "nonce"
]);
var parseNumericString = (message) => {
  if (message.length < 16) {
    if (message.length === 0) return null;
    const length = Number(message);
    if (Number.isNaN(length)) return null;
    return length;
  }
  if (message.length === 16) {
    const number = Number(message);
    if (number.toString() !== message || message.trim().length === 0 || Number.isNaN(number))
      return null;
    return number;
  }
  return null;
};
var createActiveSpanHandler = (fn) => function(span) {
  try {
    const result = fn(span);
    if (result instanceof Promise || typeof result?.then === "function")
      return Promise.resolve(result).then(
        (value) => {
          span.end();
          return value;
        },
        (rejectResult) => {
          span.setStatus({
            code: import_api.SpanStatusCode.ERROR,
            message: rejectResult instanceof Error ? rejectResult.message : JSON.stringify(
              rejectResult ?? "Unknown error"
            )
          });
          span.recordException(rejectResult);
          span.end();
          throw rejectResult;
        }
      );
    span.end();
    return result;
  } catch (error) {
    const err = error;
    span.setStatus({
      code: import_api.SpanStatusCode.ERROR,
      message: err?.message
    });
    span.recordException(err);
    span.end();
    throw error;
  }
};
var createContext = (parent) => ({
  getValue() {
    return parent;
  },
  setValue() {
    return import_api.context.active();
  },
  deleteValue() {
    return import_api.context.active();
  }
});
var serializeBody = (body) => {
  if (body instanceof Uint8Array) return { text: "", size: body.length };
  if (body instanceof ArrayBuffer) return { text: "", size: body.byteLength };
  if (body instanceof Blob) return { text: "", size: body.size };
  let text;
  try {
    text = typeof body === "object" ? JSON.stringify(body) : String(body);
  } catch {
    text = "[Unserializable]";
  }
  return { text, size: text.length };
};
var redactQueryString = (query, keys) => {
  if (query === "" || keys.size === 0) return query;
  let out = "";
  let partStart = 0;
  let keyEnd = -1;
  for (let i = 0; i <= query.length; i++) {
    const ch = i === query.length ? 38 : query.charCodeAt(i);
    if (ch === 61 && keyEnd === -1) {
      keyEnd = i;
      continue;
    }
    if (ch !== 38) continue;
    const partEnd = i;
    const rawKeyEnd = keyEnd === -1 ? partEnd : keyEnd;
    const rawKey = query.slice(partStart, rawKeyEnd);
    if (out) out += "&";
    out += keys.has(rawKey.toLowerCase()) ? rawKey + "=[REDACTED]" : query.slice(partStart, partEnd);
    partStart = i + 1;
    keyEnd = -1;
  }
  return out;
};
var shouldStartNodeSDK = (provider) => {
  return provider instanceof import_api.ProxyTracerProvider && provider.getDelegateTracer("check") === void 0;
};
var contextKeySpan = Symbol.for("OpenTelemetry Context Key SPAN");
var getTracer = () => {
  const tracer = import_api.trace.getTracer("Elysia");
  return {
    ...tracer,
    startSpan(name, options, context) {
      return tracer.startSpan(name, options, context);
    },
    startActiveSpan(...args) {
      switch (args.length) {
        case 2:
          return tracer.startActiveSpan(
            args[0],
            createActiveSpanHandler(args[1])
          );
        case 3:
          return tracer.startActiveSpan(
            args[0],
            args[1],
            createActiveSpanHandler(args[2])
          );
        case 4:
          return tracer.startActiveSpan(
            args[0],
            args[1],
            args[2],
            createActiveSpanHandler(args[3])
          );
      }
    }
  };
};
var startSpan = (name, options, context) => {
  const tracer = getTracer();
  return tracer.startSpan(name, options, context);
};
var startActiveSpan = (...args) => {
  const tracer = getTracer();
  switch (args.length) {
    case 2:
      return tracer.startActiveSpan(
        args[0],
        createActiveSpanHandler(args[1])
      );
    case 3:
      return tracer.startActiveSpan(
        args[0],
        args[1],
        createActiveSpanHandler(args[2])
      );
    case 4:
      return tracer.startActiveSpan(
        args[0],
        args[1],
        args[2],
        createActiveSpanHandler(args[3])
      );
  }
};
var record = startActiveSpan;
var getCurrentSpan = () => import_api.trace.getActiveSpan();
var setAttributes = (attributes) => !!getCurrentSpan()?.setAttributes(attributes);
var opentelemetry = ({
  serviceName = "Elysia",
  instrumentations,
  contextManager,
  checkIfShouldTrace,
  spanUrlRedaction,
  recordBody,
  headersToSpanAttributes,
  ...options
} = {}) => {
  const spanRequestHeaderSet = toHeaderNameSet(headersToSpanAttributes?.requestHeaders);
  const spanResponseHeaderSet = toHeaderNameSet(headersToSpanAttributes?.responseHeaders);
  const requestHeaderWildcard = spanRequestHeaderSet.has("*");
  const responseHeaderWildcard = spanResponseHeaderSet.has("*");
  const recordRequestBody = recordBody === true || recordBody && recordBody.request || false;
  const recordResponseBody = recordBody === true || recordBody && recordBody.response || false;
  const urlRedactOpts = spanUrlRedaction === false ? null : spanUrlRedaction ?? {};
  const sensitiveKeys = urlRedactOpts ? /* @__PURE__ */ new Set([
    ...SENSITIVE_QUERY_KEYS,
    ...(urlRedactOpts.sensitiveQueryParams ?? []).map(
      (k) => k.toLowerCase()
    )
  ]) : void 0;
  const stripCreds = urlRedactOpts?.stripCredentials !== false;
  let tracer = import_api.trace.getTracer(serviceName);
  if (shouldStartNodeSDK(import_api.trace.getTracerProvider())) {
    const sdk = new import_sdk_node.NodeSDK({
      ...options,
      serviceName,
      instrumentations
    });
    sdk.start();
    tracer = import_api.trace.getTracer(serviceName);
  } else {
  }
  if (!import_api.context._getContextManager?.() && contextManager)
    try {
      contextManager.enable();
      import_api.context.setGlobalContextManager(contextManager);
    } catch {
    }
  const meter = import_api.metrics.getMeter(serviceName);
  const httpServerDuration = meter.createHistogram(
    "http.server.request.duration",
    {
      description: "Duration of HTTP server requests.",
      unit: "s",
      advice: {
        explicitBucketBoundaries: [
          5e-3,
          0.01,
          0.025,
          0.05,
          0.075,
          0.1,
          0.25,
          0.5,
          0.75,
          1,
          2.5,
          5,
          7.5,
          10,
          30,
          60,
          120,
          300,
          600,
          900,
          1800
        ]
      }
    }
  );
  return new import_elysia.Elysia({
    name: "@elysia/opentelemetry"
  }).wrap((fn, request) => {
    const shouldTrace = checkIfShouldTrace ? checkIfShouldTrace(request) : true;
    if (!shouldTrace) return fn;
    const headers = headerHasToJSON ? (
      // @ts-ignore bun only
      request.headers.toJSON()
    ) : Object.fromEntries(request.headers.entries());
    const ctx = import_api.propagation.extract(import_api.context.active(), headers);
    return tracer.startActiveSpan(
      "Root",
      { kind: import_api.SpanKind.SERVER },
      ctx,
      (rootSpan) => {
        const spanContext = import_api.trace.setSpan(ctx, rootSpan);
        return (...args) => {
          return import_api.context.with(spanContext, () => fn(...args));
        };
      }
    );
  }).trace(
    { as: "global" },
    ({
      id,
      onRequest,
      onParse,
      onTransform,
      onBeforeHandle,
      onHandle,
      onAfterHandle,
      onError,
      onAfterResponse,
      onMapResponse,
      context,
      context: {
        path,
        request: { method }
      }
    }) => {
      const rootSpan = import_api.trace.getActiveSpan();
      if (!rootSpan) return;
      function setParent(span) {
        if (span.ended) return;
        if (rootSpan.ended) return void span.end();
        const newContext = import_api.trace.setSpan(import_api.context.active(), span);
        const currentContext = (
          // @ts-expect-error private property
          import_api.context.active()._currentContext
        );
        currentContext?.set(
          contextKeySpan,
          newContext.getValue(contextKeySpan)
        );
      }
      function inspect(name) {
        return function inspect2({
          onEvent,
          total,
          onStop
        }) {
          if (total === 0 || // @ts-ignore
          rootSpan.ended)
            return;
          tracer.startActiveSpan(
            name,
            {},
            createContext(rootSpan),
            (event) => {
              if (
                // @ts-ignore
                rootSpan.ended
              )
                return;
              onEvent(({ name: name2, onStop: onStop2 }) => {
                const useChildSpan = total > 1;
                let span;
                if (useChildSpan) {
                  span = tracer.startSpan(
                    name2,
                    {},
                    createContext(event)
                  );
                  setParent(span);
                } else {
                  setParent(event);
                  span = event;
                }
                onStop2(({ error }) => {
                  setParent(rootSpan);
                  if (span.ended || rootSpan.ended) return;
                  if (error) {
                    rootSpan.setStatus({
                      code: import_api.SpanStatusCode.ERROR,
                      message: error.message
                    });
                    span.setAttributes({
                      "error.type": error.constructor?.name ?? error.name,
                      "error.stack": error.stack
                    });
                    span.setStatus({
                      code: import_api.SpanStatusCode.ERROR,
                      message: error.message
                    });
                  } else {
                    rootSpan.setStatus({
                      code: import_api.SpanStatusCode.OK
                    });
                    span.setStatus({
                      code: import_api.SpanStatusCode.OK
                    });
                  }
                  if (useChildSpan) span.end();
                });
              });
              onStop(() => {
                setParent(rootSpan);
                if (event.ended) return;
                event.end();
              });
            }
          );
        };
      }
      const rawUrl = context.url;
      const qi = context.qi;
      const hasQuery = qi !== void 0 && qi !== -1;
      let urlQuery = hasQuery ? rawUrl.slice(qi + 1) : void 0;
      let urlFull = rawUrl;
      if (urlRedactOpts) {
        if (urlQuery !== void 0) {
          urlQuery = redactQueryString(urlQuery, sensitiveKeys);
          urlFull = `${rawUrl.slice(0, qi)}?${urlQuery}`;
        }
        if (stripCreds && urlFull.indexOf("@") > 0) {
          try {
            const u = new URL(urlFull);
            if (u.username || u.password) {
              u.username = "";
              u.password = "";
              urlFull = u.href;
            }
          } catch {
          }
        }
      }
      const attributes = Object.assign(/* @__PURE__ */ Object.create(null), {
        // ? Elysia Custom attribute
        "http.request.id": id,
        "http.request.method": method,
        "url.path": path,
        "url.full": urlFull
      });
      if (urlQuery !== void 0)
        attributes["url.query"] = urlQuery;
      const protocolSeparator = urlFull.indexOf("://");
      if (protocolSeparator > 0)
        attributes["url.scheme"] = urlFull.slice(
          0,
          protocolSeparator
        );
      const requestStartTime = performance.now();
      let durationRecorded = false;
      const recordDuration = () => {
        if (durationRecorded) return;
        durationRecorded = true;
        const durationS = (performance.now() - requestStartTime) / 1e3;
        const statusCode = attributes["http.response.status_code"];
        const metricAttributes = {
          "http.request.method": attributes["http.request.method"] ?? method,
          "url.scheme": attributes["url.scheme"],
          "http.response.status_code": statusCode,
          "http.route": attributes["http.route"]
        };
        if (typeof statusCode === "number" && statusCode >= 500)
          metricAttributes["error.type"] = String(statusCode);
        httpServerDuration.record(durationS, metricAttributes);
      };
      onRequest(inspect("Request"));
      onParse(inspect("Parse"));
      onTransform(inspect("Transform"));
      onBeforeHandle(inspect("BeforeHandle"));
      onHandle(({ onStop }) => {
        const span = tracer.startSpan(
          "Handle",
          {},
          createContext(rootSpan)
        );
        setParent(span);
        onStop(({ error }) => {
          setParent(rootSpan);
          if (span.ended || rootSpan.ended) return;
          if (error) {
            rootSpan.setStatus({
              code: import_api.SpanStatusCode.ERROR,
              message: error.message
            });
            span.setStatus({
              code: import_api.SpanStatusCode.ERROR,
              message: error.message
            });
            span.recordException(error);
            rootSpan.recordException(error);
          } else {
            rootSpan.setStatus({
              code: import_api.SpanStatusCode.OK
            });
            span.setStatus({
              code: import_api.SpanStatusCode.OK
            });
          }
          span.end();
        });
      });
      onAfterHandle(inspect("AfterHandle"));
      onError((event) => {
        inspect("Error")(event);
        event.onStop(({ error }) => {
          setParent(rootSpan);
          if (rootSpan.ended) return;
          {
            let status = context.set.status;
            if (typeof status === "string") {
              status = import_elysia.StatusMap[status];
            } else if (typeof status !== "number" && // @ts-ignore
            typeof error?.status === "number")
              status = error.status;
            if (typeof status === "number") {
              attributes["http.response.status_code"] = status;
              if (status >= 500)
                rootSpan.setStatus({
                  code: import_api.SpanStatusCode.ERROR
                });
            }
            rootSpan.setAttributes(attributes);
          }
          if (
            // @ts-ignore
            !rootSpan.ended
          ) {
            recordDuration();
            rootSpan.end();
          }
        });
      });
      onMapResponse(inspect("MapResponse"));
      onTransform(() => {
        const { cookie, request, route, path: path2 } = context;
        if (route)
          rootSpan.updateName(
            // @ts-ignore private property
            `${method} ${route || path2}`
          );
        if (context.route) attributes["http.route"] = context.route;
        const contentLength = request.headers.get("content-length");
        if (contentLength) {
          const number = parseNumericString(contentLength);
          if (number !== null)
            attributes["http.request_content_length"] = number;
        }
        const userAgent = request.headers.get("User-Agent");
        if (userAgent)
          attributes["user_agent.original"] = userAgent;
        const server = context.server;
        if (server) {
          attributes["server.port"] = server.port ?? 80;
          attributes["server.address"] = server.url.hostname;
        }
        let headers;
        {
          let hasHeaders;
          let _headers;
          if (context.headers) {
            hasHeaders = true;
            headers = context.headers;
            _headers = Object.entries(context.headers);
          } else if (hasHeaders = headerHasToJSON) {
            headers = request.headers.toJSON();
            _headers = Object.entries(headers);
          } else {
            headers = {};
            _headers = request.headers.entries();
          }
          for (let [key, value] of _headers) {
            key = key.toLowerCase();
            if (hasHeaders) {
              if (!requestHeaderWildcard && !spanRequestHeaderSet.has(key)) continue;
              if (typeof value === "object")
                attributes[`http.request.header.${key}`] = JSON.stringify(value);
              else if (value !== void 0)
                attributes[`http.request.header.${key}`] = value;
              continue;
            }
            if (typeof value === "object") {
              const serialized = JSON.stringify(value);
              headers[key] = serialized;
              if (requestHeaderWildcard || spanRequestHeaderSet.has(key))
                attributes[`http.request.header.${key}`] = serialized;
            } else if (value !== void 0) {
              headers[key] = value;
              if (requestHeaderWildcard || spanRequestHeaderSet.has(key))
                attributes[`http.request.header.${key}`] = value;
            }
          }
        }
        {
          let headers2;
          if (context.set.headers instanceof Headers) {
            if (headerHasToJSON)
              headers2 = Object.entries(
                // @ts-ignore bun only
                context.set.headers.toJSON()
              );
            else headers2 = context.set.headers.entries();
          } else headers2 = Object.entries(context.set.headers);
          for (let [key, value] of headers2) {
            key = key.toLowerCase();
            if (!responseHeaderWildcard && !spanResponseHeaderSet.has(key)) continue;
            if (typeof value === "object")
              attributes[`http.response.header.${key}`] = JSON.stringify(value);
            else
              attributes[`http.response.header.${key}`] = value;
          }
        }
        if (context.ip)
          attributes["client.address"] = context.ip;
        else {
          const ip = headers["true-client-ip"] ?? headers["cf-connection-ip"] ?? headers["x-forwarded-for"] ?? headers["x-real-ip"] ?? server?.requestIP(request);
          if (ip)
            attributes["client.address"] = typeof ip === "string" ? ip : ip.address ?? ip.toString();
        }
        if ((requestHeaderWildcard || spanRequestHeaderSet.has("cookie")) && cookie) {
          const _cookie = {};
          for (const [key, { value }] of Object.entries(cookie))
            _cookie[key] = JSON.stringify(value);
          attributes["http.request.cookie"] = JSON.stringify(_cookie);
        }
        rootSpan.setAttributes(attributes);
      });
      onParse(() => {
        const body = context.body;
        if (body === void 0 || body === null || !recordRequestBody)
          return;
        const { text, size } = serializeBody(body);
        if (text) attributes["http.request.body"] = text;
        attributes["http.request.body.size"] = size;
      });
      onMapResponse(() => {
        const body = context.body;
        if (body !== void 0 && body !== null && recordRequestBody) {
          const { text, size } = serializeBody(body);
          if (text) attributes["http.request.body"] = text;
          attributes["http.request.body.size"] = size;
        }
        {
          let status = context.set.status ?? 200;
          if (typeof status === "string")
            status = import_elysia.StatusMap[status] ?? 200;
          attributes["http.response.status_code"] = status;
        }
        const response = context.responseValue;
        if (response !== void 0 && recordResponseBody) {
          const { text, size } = serializeBody(response);
          if (text) attributes["http.response.body"] = text;
          attributes["http.response.body.size"] = size;
        }
        if (!rootSpan.ended) {
          const statusCode = attributes["http.response.status_code"];
          if (typeof statusCode === "number" && statusCode >= 500) {
            rootSpan.setStatus({
              code: import_api.SpanStatusCode.ERROR
            });
          }
          rootSpan.setAttributes(attributes);
        }
      });
      onAfterResponse((event) => {
        inspect("AfterResponse")(event);
        {
          let status = context.set.status ?? 200;
          if (typeof status === "string")
            status = import_elysia.StatusMap[status] ?? 200;
          attributes["http.response.status_code"] = status;
        }
        const body = context.body;
        if (body !== void 0 && body !== null && recordRequestBody) {
          const { text, size } = serializeBody(body);
          if (text) attributes["http.request.body"] = text;
          attributes["http.request.body.size"] = size;
        }
        if (!rootSpan.ended) {
          const statusCode = attributes["http.response.status_code"];
          if (typeof statusCode === "number" && statusCode >= 500)
            rootSpan.setStatus({
              code: import_api.SpanStatusCode.ERROR
            });
          rootSpan.setAttributes(attributes);
        }
        event.onStop(() => {
          setParent(rootSpan);
          if (rootSpan.ended) return;
          if (
            // @ts-ignore
            !rootSpan.ended
          ) {
            recordDuration();
            rootSpan.end();
          }
        });
      });
      context.request.signal.addEventListener("abort", () => {
        const active = import_api.trace.getActiveSpan();
        if (active && !active.ended) active.end();
        if (rootSpan.ended) return;
        rootSpan.setStatus({
          code: import_api.SpanStatusCode.ERROR,
          message: "Request aborted"
        });
        recordDuration();
        rootSpan.end();
      });
    }
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  contextKeySpan,
  getCurrentSpan,
  getTracer,
  opentelemetry,
  record,
  setAttributes,
  shouldStartNodeSDK,
  startActiveSpan,
  startSpan
});
