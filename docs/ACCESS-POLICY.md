# Sign-in access policy

As requested, most Leafster features require sign-in. This is enforced by a server-side gate, as well as the interface.

An approved, active account with its adult staging profile completed is required to browse videos, search the catalogue, view channels, read Leaves, open Stories, view collections, load thumbnails or retrieve video and Story media. Copying an underlying media URL does not bypass this check. The same policy applies to content with a `public` visibility setting: public content is discoverable among eligible signed-in members. Ownership, blocking, suspension, private-content restrictions, expiration and moderator permissions continue to apply after sign-in.

Visitors can still open the interface, privacy information, terms and community guidelines; check service health; start official Google sign-in; and submit a confidential copyright, illegal-content or child-safety notice. Notice submission uses an anonymous CSRF session and rate limits, and does not reveal the moderation queue. Public registration remains closed; Google identity access requires the configured adult staging allowlist, with adult self-declaration during onboarding. Google Sign-In and that declaration do not independently verify age.

Signed-out community requests return401. Signed-in users who have not finished onboarding receive403 until their profile is complete. Signing out, revoking a session or suspending an account removes content access. Removing an existing Google account from the allowlist revokes its sessions on the next request.

The automated access tests check catalogue and discovery feeds, channel URLs, Leaves, Stories, public collections, thumbnail and media URLs, signed-out sessions, onboarding, sign-out, and continued notice submission for non-account holders. The real media integration tests use authenticated viewers for playback and verify that signed-out media requests are rejected.
