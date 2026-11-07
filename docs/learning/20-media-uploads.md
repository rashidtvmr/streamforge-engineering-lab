# PR 20 — Real MP4 uploads and HTTP range requests

Creators can attach a bounded MP4 file to owned drafts with a raw PUT request. The server checks Content-Type and MP4 ftyp bytes, rejects content over 8 MiB, stores bytes durably in SQLite and only serves them publicly after publication. Range requests return 206 and a Content-Range for browser playback.

**19 native platform tests passed locally**, including owner checks, hidden draft media and 206 range responses. This demo does not transcode, scan, or distribute media and must not be exposed as an unrestricted production upload endpoint.
