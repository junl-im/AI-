# Apply mobile studio hardening

From the SoriON repository root:

```bash
node APPLY_MOBILE_STUDIO_HARDENING.mjs
node VERIFY_MOBILE_STUDIO_HARDENING.mjs
npm run quality:mobile-studio
```

Then run the normal Web quality workflow.

The patch is idempotent and can be applied to current `0.11.15` main or after the Live Voice + MY VOICE integration candidate. When MY VOICE files are present, the mobile quality contract automatically checks the extra linkage path.

For real Chromium mobile layout evidence after a production build:

```bash
npm run build
npm run quality:mobile-layout
```

This uses the repository's existing dependency-free CDP runner and captures 360x800, 390x844, and 430x932 evidence.
