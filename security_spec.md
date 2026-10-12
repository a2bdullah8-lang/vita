# Security Specification & Test Invariants

## Data Invariants
1. All documents exist under `/users/{userId}/...` path hierarchy.
2. Read and write operations are strictly restricted to authenticated users matching `request.auth.uid == userId`.
3. Document IDs are guarded with `isValidId()` regex `^[a-zA-Z0-9_\-]+$` and length $\le 128$.
4. Validations enforce schema boundaries: `currentWeightKg` and `targetWeightKg` are numbers, meal names are $\le 100$ characters, and messages are arrays $\le 50$ items.

## The Dirty Dozen Payloads Handled
1. Unauthenticated read on `/users/{userId}`: Blocked (`isSignedIn()` fails).
2. Authenticated user A attempting to write `/users/{userB}`: Blocked (`isOwner()` fails).
3. Attempting to inject oversized 1MB strings into document IDs: Blocked (`isValidId()` bounds).
4. Malicious client modifying another user's workout log: Blocked.
5. Missing required fields in meal payload: Blocked (`isValidMeal` check).
6. Non-numeric calories or negative array structures: Blocked.
7. Attempting to delete someone else's daily health logs: Blocked.
8. Listing `/users` without scoping to owner: Blocked.
9. Attempting to bypass path constraints with `/../` directory traversals: Blocked (`isValidId` pattern).
10. Spoofing user ID inside child document while request is from another user: Blocked (`data.userId == userId`).
11. Unauthenticated SOS chatbot history scrapers: Blocked.
12. Attempting to execute wildcard collection writes: Blocked by default-deny rule.
