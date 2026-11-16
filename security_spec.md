# Security Specification — MilkLedger

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}/entries/{entryId}`, `/users/{userId}/sources/{sourceId}`, and `/users/{userId}/settings/{settingId}` belongs exclusively to `userId == request.auth.uid` with `request.auth.token.email_verified == true`.
2. **Identity Integrity**: The `userId` field inside every document must strictly equal `request.auth.uid` and the path `{userId}` parameter, and is immutable after creation.
3. **Temporal Integrity**: `createdAt` and `updatedAt` must strictly equal `request.time` on creation; `createdAt` is immutable on update and `updatedAt` must equal `request.time` on update.
4. **No Shadow Fields**: Document creation enforces both `keys().hasAll(...)` and `keys().hasOnly(...)`; updates enforce `affectedKeys().hasOnly(...)` combined with `isValid[Entity](incoming())`.
5. **Resource Exhaustion Guard**: All path IDs match `^[a-zA-Z0-9_-]+$` with length `1..128`. All strings enforce `.size()` bounds and numeric fields enforce finite min/max ranges.
6. **Settings Singleton**: Only `settingId == "preferences"` is permitted under `/users/{userId}/settings/{settingId}`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Cross-Tenant Read/List**: User B queries `/users/{userA}/entries` -> Denied by `isOwner(userId)` & `resource.data.userId == request.auth.uid`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a `MilkEntry` -> Denied by `isVerified()`.
3. **Identity Spoofing on Create**: User A writes to `/users/{userA}/entries/{id}` with `userId: "userB"` -> Denied by `data.userId == userId`.
4. **Shadow / Ghost Field Injection**: User A includes `"isAdmin": true` or `"extraFlag": 1` in `MilkEntry` create -> Denied by `hasOnly(...)`.
5. **Client Timestamp Forgery**: User A creates a `MilkEntry` with `createdAt: "2020-01-01T00:00:00Z"` -> Denied by `incoming().createdAt == request.time`.
6. **Immutable Field Mutation**: User A updates `createdAt` or `userId` on an existing `MilkEntry` -> Denied by `incoming().createdAt == existing().createdAt && incoming().userId == existing().userId`.
7. **ID Poisoning**: User A writes to `/users/{userA}/entries/bad$id..with..dots` or 500-char ID -> Denied by `isValidId(entryId)`.
8. **Type Poisoning on Update**: User A updates `quantity` to `"10 liters"` (string) or `-5` -> Denied by `isValidMilkEntry(incoming(), userId)`.
9. **String Exhaustion (DoW)**: User A supplies a 10,000-char `notes` field -> Denied by `data.notes.size() <= 300`.
10. **Invalid Enum Value**: User A sets `session: "midnight"` or `unit: "oz"` -> Denied by `in ['morning', 'evening', 'other']` and `in ['L', 'gal']`.
11. **Malformed Date String**: User A sets `date: "15-11-2026"` -> Denied by `data.date.matches('^\\d{4}-\\d{2}-\\d{2}$')`.
12. **Arbitrary Settings Doc ID**: User A writes to `/users/{userA}/settings/arbitraryDoc` -> Denied by `settingId == 'preferences'`.
