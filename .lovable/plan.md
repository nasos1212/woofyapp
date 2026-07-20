Problem
`npm run build` fails at the `prebuild` step with `sh: bunx: command not found`. The `prebuild` and `predev` scripts in `package.json` call `bunx tsx scripts/generate-sitemap.ts`, but the local machine only has npm, and `tsx` is not declared as a dev dependency.

Plan
1. Add `tsx` as a dev dependency so it is installed with `npm install`.
2. Update the `prebuild` and `predev` scripts in `package.json` from `bunx tsx scripts/generate-sitemap.ts` to `npx tsx scripts/generate-sitemap.ts`.
3. Run `npm install` to update the lockfile and install `tsx`.
4. Run `npm run build` to verify the sitemap is generated and Vite completes successfully.

What this does not change
- The sitemap logic in `scripts/generate-sitemap.ts` stays the same.
- No Capacitor/iOS native code is touched.

Next steps after this fix
Continue with the iOS build checklist:
- `npx cap add ios` (if not done)
- `npx cap sync ios`
- `npx cap open ios`
- Configure Signing & Associated Domains in Xcode

No clarifying questions needed — this is a straightforward environment mismatch.