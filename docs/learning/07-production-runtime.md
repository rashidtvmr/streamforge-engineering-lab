# PR 07 — A real production serving boundary

Until now, Vite served the client and a separate development port served the API. A production build requires a way to deliver both from a single origin.

## Changes

- The HTTP server streams `dist/index.html` and Vite-generated assets, preserving JSON API routes.
- Static filenames are allowlisted; requests for traversal or arbitrary files return 404.
- Hashed asset files can use immutable cache headers; the HTML entrypoint uses no-cache.
- A restrictive Content Security Policy permits the one shared CC0 sample-video host while denying arbitrary script and object sources.
- The Docker image uses a Node build stage and a dependency-free runtime stage (Node 22's TypeScript type stripping).
- Node's actual socket-level integration tests verify HTML, JS, cache headers, CSP, route precedence and path traversal.

## Run

```sh
npm install
npm run build
npm start
# http://127.0.0.1:4000
```

Or with Docker:

```sh
docker build -t streamforge .
docker run --rm -p 127.0.0.1:4000:4000 streamforge
```

## Evidence

In the authoring environment, **23 dependency-free Node tests pass**, including four actual HTTP production-static tests. Actual Vite production-build and Docker-image creation cannot be verified here because package downloads and Docker execution are unavailable.

## Engineering questions

Why is serving large assets as a stream preferable to reading the entire file into memory? Why should hashed JavaScript be cached longer than index.html? What could go wrong if the app listened only on 127.0.0.1 inside a container?

## Production limitations

This is an educational deployable **demo**. It does not implement authentication, uploads, transcoding, multi-tenant authorization, durable user data, observability, abuse controls, billing or zero-downtime migrations. Those must be designed as additional projects before an actual customer-facing SaaS release.
