# PR 10 — End-to-end identity workflow

The React account screen uses real versioned HTTP endpoints. Passwords are never written to localStorage. A session survives reloads because the server manages an HttpOnly cookie.

## Tests
A Playwright user journey registers a unique synthetic account, reloads, checks that the session remains, and signs out. Its actual browser execution awaits npm installation and CI runner provisioning.

## Review
Why is cookie-based identity not the same as the earlier localStorage watchlist? What is the difference between signed-in state and an authenticated server request? Why test reload behavior?
