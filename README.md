# Koa Stream Replacement Memory Leak Fix - Issue #1834

This demo shows the critical bug identified in [PR #1893 discussion](https://github.com/koajs/koa/pull/1893#discussion_r2455395874) where sequentially replacing streams causes unhandled errors and memory leaks.

## The Problem

When developers assign multiple failing streams in succession to `ctx.body`, the current implementation has a critical flaw:

```javascript
ctx.body = fs.createReadStream('does-not-exist-1.txt')
ctx.body = fs.createReadStream('does-not-exist-2.txt')
```

**What happens:**
1. First stream is assigned to `ctx.body`
2. Second stream replaces the first
3. The first stream is **not properly cleaned up**
4. When the first stream errors (asynchronously), it throws an **unhandled error**
5. This can **crash the server** or leak memory

## The Solution

The fix properly cleans up replaced streams in `lib/response.js`:

```javascript
// When a new stream replaces an existing stream
if (original !== val) {
  if (original != null) this.remove('Content-Length')

  const shouldDestroyOriginal = original && isStream(original)
  if (shouldDestroyOriginal) {
    original.once('error', () => {}) // Prevent unhandled errors
    destroy(original)
  }
}
```

**Key improvements:**
- Detects when one stream replaces another
- Adds noop error handler before destroying to prevent unhandled exceptions
- Properly destroys the old stream to free resources
- Works with Stream.pipeline() for complete error handling

## Running the Demo

1. **Start the demo server:**
   ```bash
   npm install
   npm start
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Test both behaviors:**
   - Click "Test Buggy Behavior" to see unhandled errors
   - Click "Test Fixed Behavior" to see proper cleanup

## What You'll See

### Buggy Behavior (Before Fix)
- ❌ Stream replaced but not cleaned up
- ❌ Unhandled error exception thrown
- ❌ Server could crash in production

### Fixed Behavior (After Fix)
- ✅ Old stream properly destroyed
- ✅ No unhandled errors
- ✅ Safe stream replacement
- ✅ No memory leaks

## Related Issues

- #1834 - Original memory leak report
- #1882 - Related streaming issues
- #1889 - Additional stream handling bugs
- PR #1893 - Fix implementation and discussion
