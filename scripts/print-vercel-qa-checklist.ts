#!/usr/bin/env tsx
/**
 * Production QA checklist for Vercel — run after deploying P0–P1 backlog items.
 * Usage: npx tsx scripts/print-vercel-qa-checklist.ts
 */

const checklist = [
  "1. Join flow: logged-out user → public room URL → login → join-gate → Join → history loads.",
  "2. Hero groups (logged in): home → Groups mode → 3+ chars → dialog results → join → /chat?room=slug.",
  "3. Hero groups (logged out): search → redirect /chat?q=... → discover in sidebar.",
  "4. Chat unread: user B sends 3 messages → user A room list badge matches batch unread count.",
  "5. Post comments: user B comments on user A post → notification badge + in-app toast (+ push if VAPID set).",
  "6. Push: Profile Settings → Enable push → Test push → notification outside tab; click opens correct URL.",
  "7. No duplicates: with tab open, same notification is not shown as both push and poll toast twice.",
  "8. VAPID: GET /api/push/vapid-public-key returns enabled: true on production.",
];

console.log("Vercel Production QA Checklist\n");
for (const item of checklist) {
  console.log(`[ ] ${item}`);
}
console.log(
  "\nSet VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in Vercel env before push QA.",
);
