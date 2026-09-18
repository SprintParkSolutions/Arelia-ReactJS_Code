# Consultation sign-up
Book Consultation opens the six-field account form. A successful POST to
`/services/apexrest/registration/leads` must return `success: true` and a
`leadId` before the UI shows success and navigates to `/login?account=prospect`.
Both /login and /login?account=prospect use `/registration/lead/login`; explicit client portal sign-in (/login?account=client)
continues using the existing endpoint.

## Salesforce integration
Phone Number is required. The country picker lists all countries supported by the
installed phone-number library and defaults to India (+91). Validation uses the
selected country's phone rules. The phone input accepts digits only. National prefixes and formatting are normalized:
India 9876543210 becomes +919876543210; UK 02079460018 becomes +442079460018.
The request sends the complete international number in phone, which Apex assigns
directly to Lead.Phone.

Deploy the updated salesforce/classes/RegistrationLeadRest.cls before using this
flow with an endpoint that still enforces exactly 10 digits. Its updated validator
accepts international numbers (+ and 7–15 digits) and retains legacy 10-digit
support. This local Apex update has not been deployed or tested in the org.

The adapted class retains the supplied 20-character password field limit.
Password values are preserved rather than silently trimmed. Frontend validation
rejects leading/trailing spaces to remain compatible with the supplied login class.
The existing Salesforce site must expose the registration and lead login classes
and allow this website's origin. Apply and run Apex tests in the target org before
deployment; no org deployment or live Lead creation is performed by the frontend tests.

## Credential storage
The supplied Apex implementation stores both password fields directly as text.
The UI keeps passwords only in component memory and clears them after signup.
For production authentication, replace the plaintext Apex credential scheme with
a proper identity provider or securely hashed server-side credentials.

## Checks
Run npm test, npm run lint, and npm run build.

## Email OTP flow
Sign Up validates all fields, then calls /registration/otp with email and a
cryptographically generated six-digit otp using the supplied controller contract.
Only a successful HTTP response with success: true opens verification. The website
compares the entered code before calling /registration/leads. Codes expire after
60 seconds, allow at most five incorrect attempts, and can then be resent.
Changing details invalidates the current code. Failed email delivery never creates
a Lead. Passwords and pending registration details remain in component memory.

Security limitation: the supplied endpoint only sends email. Verification is
client-side and cannot enforce email ownership against direct API callers.
Production enforcement requires server-generated/stored challenges, a verification
endpoint, and a single-use verification token checked by the Lead creation API.
No Salesforce deployment or actual email delivery was performed in local tests.