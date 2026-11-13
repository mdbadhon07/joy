# Security Specification — Joy Kumar Store Cloud Sync

## 1. Data Invariants
1. **Strict Multi-Tenant Ownership**: Every store owner's data resides under `/users/{userId}` where `userId == request.auth.uid` and `request.auth.token.email_verified == true`. No user can read, list, create, update, or delete another user's account, customers, or transactions.
2. **Master Gate Parent Integrity**: Every document in `/users/{userId}/customers/{customerId}` and `/users/{userId}/transactions/{transactionId}` requires the parent `/users/{userId}` document to exist (`exists(...)`), and every transaction must reference an existing or atomically created customer (`existsAfter(...)`).
3. **Immutable Identity & Server Timestamps**: `uid`, `ownerUid`, `id`, `customerId`, and `createdAt` are immutable once created. `createdAt` and `updatedAt` must strictly equal `request.time`.
4. **No Shadow Fields & Strict Boundaries**: Every document creation enforces both `keys().hasAll(...)` and `keys().hasOnly(...)`. Every update uses `affectedKeys().hasOnly(...)` combined with full `isValid...` schema validation. Every string enforces `.size()` limits, and all document IDs match `^[a-zA-Z0-9_\-]+$`.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: `request.auth == null` attempting `get` or `create` on `/users/uid1/customers/c1`.
2. **Unverified Email Spoof**: `request.auth != null` with `email_verified: false` attempting to create `/users/uid1`.
3. **Cross-Tenant Read/List**: Signed-in `uid2` attempting `get` or `list` on `/users/uid1/customers`.
4. **Identity Spoofing on Create**: `uid1` creating `/users/uid1/customers/c1` with `ownerUid: "uid2"`.
5. **Shadow Field Injection**: `uid1` creating `/users/uid1/customers/c1` with extra ghost field `isAdmin: true`.
6. **Client Timestamp Tampering**: `uid1` creating `/users/uid1/transactions/tx1` with `createdAt: Timestamp(2020-01-01)`.
7. **ID Poisoning (1.5KB Junk ID)**: `uid1` creating `/users/uid1/customers/<1500-char-id>` or ID containing invalid characters (`c$1`).
8. **Type Poisoning on Update**: `uid1` updating `currentDebt` on `/users/uid1/customers/c1` to a string `"500"` instead of a number.
9. **Negative Debt / Negative Purchase Poisoning**: `uid1` creating `/users/uid1/customers/c1` with `currentDebt: -500`.
10. **Immutable Field Mutation**: `uid1` updating `ownerUid` or `createdAt` on `/users/uid1/customers/c1`.
11. **Orphaned Transaction Create**: `uid1` creating `/users/uid1/transactions/tx1` pointing to a nonexistent `customerId: "nonexistent_c"`.
12. **Blanket List Without Owner Filter**: Querying `/users/uid1/customers` as `uid2` or without matching `resource.data.ownerUid == request.auth.uid`.
