# Koa TCP Memory Leak Fix Demo - Issue #1834

This demo shows the TCP memory leak issue that occurs when streaming from fetch responses and how the fix resolves it.

## The Problem

When using `node-fetch` (or similar) to stream responses through Koa, memory leaks can occur if clients disconnect before the stream completes. This happens because:

1. Koa pipes the fetch response stream to the HTTP response
2. When the client disconnects, Koa destroys its side of the stream
3. But the underlying fetch request continues, keeping sockets and memory allocated
4. Over time, this leads to memory leaks and potential server instability

## The Solution

The fix adds automatic abort handling for `ReadableStream` and `Response` objects:

- When clients disconnect, the system properly cancels the underlying streams
- This ensures fetch requests are aborted and resources are cleaned up
- Memory leaks are prevented

## Running the Demo

1. **Start the problematic server:**
   ```bash
   node issue-demo.js
   ```
