# Security Specification — Khul World Firestore Rules

## 1. Data Invariants
1. **Admin Privilege Separation**: Only verified users matching the bootstrapped admin email (`tsigeselamawit925@gmail.com`) or having an active `/admins/{uid}` document can create, update, or delete public catalog documents (`/public_config/*`, `/sessions/*`, `/packages/*`, `/products/*`, `/announcements/*`, `/virtue_gifts/*`).
2. **PII Isolation**: User emails, phone numbers, and delivery addresses are isolated in `/members/{userId}`, `/registrations/{regId}`, `/orders/{orderId}`, and `/corporate_inquiries/{inquiryId}`. Public `/leaderboard/{userId}` holds zero PII.
3. **Owner Integrity**: Member-created records (`/registrations`, `/orders`, `/corporate_inquiries`) must set `ownerId == request.auth.uid` on creation and keep `ownerId` immutable on updates.
4. **Initial Status & Privilege Escalation Prevention**: New registrations must start as `Confirmed`, new orders as `Reserved`, and new corporate inquiries as `New Inquiry`. Members cannot self-assign `awardedBadge` on `/leaderboard/{userId}` or create `/admins/{uid}` documents.
5. **Temporal Integrity**: `createdAt` and `updatedAt` fields must strictly equal `request.time`.

## 2. Dirty Dozen Adversarial Payloads
1. Unauthenticated write to `/sessions/wed-1` -> **PERMISSION_DENIED**
2. Non-admin verified user updating `/public_config/brand` -> **PERMISSION_DENIED**
3. Unverified email spoof (`email == 'tsigeselamawit925@gmail.com'`, `email_verified: false`) writing `/announcements/ann-x` -> **PERMISSION_DENIED**
4. Non-admin creating `/admins/{uid}` to escalate privilege -> **PERMISSION_DENIED**
5. Non-admin updating `awardedBadge` on `/leaderboard/{uid}` -> **PERMISSION_DENIED**
6. Member creating `/registrations/{id}` with `ownerId` set to another UID -> **PERMISSION_DENIED**
7. Member creating `/orders/{id}` with pre-approved `status: 'Completed'` -> **PERMISSION_DENIED**
8. Shadow field injection (`extraAdminFlag: true`) on `/products/{id}` or `/orders/{id}` -> **PERMISSION_DENIED**
9. Non-owner reading `/registrations/{id}` or `/members/{otherUid}` -> **PERMISSION_DENIED**
10. Resource poisoning with 1.5KB document ID (`isValidId` guard) -> **PERMISSION_DENIED**
11. Client-forged `updatedAt` timestamp (`!= request.time`) -> **PERMISSION_DENIED**
12. Unbounded string > maxLength in `/announcements/{id}` `body` -> **PERMISSION_DENIED**
