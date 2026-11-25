# SiteNova Restaurant ERP — deployment and operations

This guide describes the deployment and operational capabilities verified in this repository. It is a customization guide for the upstream OrderRestro codebase; it does not change the upstream AGPL-3.0 license or remove upstream attribution.

## Deployment choices

### Local restaurant server (LAN)

The documented default is one local server running the Docker Compose stack. POS, billing, kitchen display and printing are designed to continue on the restaurant LAN when the internet/WAN is unavailable. Other tills, tablets and kitchen screens connect to the server over the local network.

### VPS or cloud server

The same Docker Compose stack can run on a VPS. This is self-managed hosting: the operator is responsible for the server, network exposure, TLS/reverse proxy, updates, database and backups. It is not a managed SiteNova cloud service.

### HTTPS / reverse proxy

When the application is exposed through HTTPS, set `COOKIE_SECURE=true` in the backend environment. For plain HTTP on a trusted LAN, keep it false. Configure `FRONTEND_ORIGIN` / `CORS_ORIGIN`, `PUBLIC_BASE_URL`, and trusted proxy hops only for the actual deployment topology. Do not expose the PostgreSQL or backend ports directly to the public internet.

## Required deployment secrets

Before a non-development deployment, create a private `.env` file and set at least:

- `POSTGRES_PASSWORD`: a strong unique database password (do not use the Compose development default).
- `JWT_SECRET`: a long random secret.
- `FRONTEND_ORIGIN`: the actual web origin allowed by the backend.
- `COOKIE_SECURE=true` when served through HTTPS.
- `PUBLIC_BASE_URL`: the externally reachable HTTPS origin when payment webhooks/returns are used.
- `INTEGRATION_SECRET_KEY` or `INTEGRATION_SECRET_KEY_FILE` before saving live payment credentials. Prefer a dedicated key, kept outside the database and container image.

Keep `.env`, provider credentials, sync keys, and backup access keys out of Git, client-side code, screenshots and support messages.

## Backup and restore

The application exposes two backup paths in Settings → Backup:

1. **Download a backup** creates a ZIP containing the database and uploaded files (including menu photos and logos). Store it securely because it contains customer and sales information.
2. **S3-compatible scheduled backups** can target a compatible object-storage bucket. The UI supports endpoint, bucket, access key, secret key, region, schedule interval and retention count. The feature is instance-wide: it covers every restaurant on that server.

The Docker Compose file also documents optional S3 environment variables for headless deployments. Settings saved in the database take priority over those environment variables.

Operational checklist:
- Configure a private bucket and least-privilege credentials.
- Trigger a backup and confirm its status is VERIFIED.
- Download or independently inspect a backup artifact.
- Perform a restore rehearsal on a separate test instance before relying on the backup for disaster recovery.
- Keep at least one backup copy outside the production server and protect it as sensitive data.

A successful backup status is not a substitute for a restore rehearsal.

## Local server sync

Settings → Sync supports connecting a PC to a central server using the server URL and sync key. The first connection offers:
- **Use the server's data**: replaces this PC's data and signs the user out.
- **Merge both**: keeps local data and adds it to the server.

The UI describes bidirectional syncing and says newest edit wins. It also exposes last-sync time, pending upload count, sync errors and changes that could not be applied. Test the connection before enabling sync, review conflicts, and take backups before choosing a first-sync mode. Do not assume conflict-free multi-writer database replication.

The Compose file supports a server-side `SYNC_API_KEY`. Keep it private and configure clients with the matching key.

## Online payment gateways

The payment integration uses provider-hosted payment pages; card numbers and CVVs are not handled by this application.

Repository documentation currently identifies these integrations:
- Razorpay: hosted payment links and refunds.
- Stripe: hosted checkout sessions and refunds.
- Cashfree Payments: hosted payment links; refunds are handled in Cashfree's dashboard and recorded locally.

These integrations have not been validated end-to-end against live merchant accounts in the repository's payment guide. Run a sandbox payment end to end before production use. The other providers shown in the catalog are reference-only unless a gateway adapter is implemented.

Before enabling live payments:
1. Configure the dedicated integration encryption key.
2. Add complete Test credentials and test the connection.
3. Configure the Test webhook at the provider.
4. Complete a sandbox checkout and verify the payment in Settings → Payments.
5. Configure Live credentials and Live webhook separately.
6. Confirm the provider's merchant account, currency and settlement configuration.
7. Switch to Live only after the above checks and the explicit in-app confirmation.

Never put gateway secrets in browser code, a public repository, or a mobile app.

## Release readiness checklist

- [ ] Set strong production secrets; remove development defaults.
- [ ] Confirm public exposure is HTTPS and secure cookies are enabled.
- [ ] Confirm database and backend ports are not publicly exposed.
- [ ] Confirm persistent Docker volumes are present for PostgreSQL, uploads and backend state.
- [ ] Create a backup and complete a restore rehearsal.
- [ ] Test local LAN operation with the WAN disconnected if using a local deployment.
- [ ] Test sync on a separate client and review conflict handling if sync is needed.
- [ ] Run provider sandbox payments and verify reconciliation before enabling live payments.
- [ ] Verify printing with the actual printer and device.
- [ ] Run the production build, automated tests and browser/device checks on the release candidate.

## Scope and limitations

This guide does not claim that a SiteNova-managed cloud service, subscription billing, conflict-free multi-writer sync, or live merchant payment certification is included. Verify the actual deployment, provider account and release candidate before accepting production traffic.
