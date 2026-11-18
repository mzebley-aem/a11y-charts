# Releasing and installing

The three chart packages publish together to GitHub Packages at one shared version:

- `@mzebley-aem/target-line-chart`
- `@mzebley-aem/bar-chart`
- `@mzebley-aem/segmented-bar-chart`

GitHub Packages requires the npm scope to match the owning account, which is why
the scope is `@mzebley-aem`. Published packages have no runtime dependencies
(ECharts is bundled into the target line chart).

## Release

1. Set the version on every package and its lockfile:

   ```bash
   npm run release:version -- 0.2.0
   ```

2. Check it, commit, and merge to `main`:

   ```bash
   npm run release:check
   ```

3. Tag the merged commit and push the tag:

   ```bash
   git tag v0.2.0 && git push origin v0.2.0
   ```

The `Publish packages` workflow (`.github/workflows/publish.yml`) then:

- confirms the tag matches every package version;
- runs `npm run verify` (unit tests, typecheck, build, packed-tarball smoke checks);
- publishes the three packages with the repository's `GITHUB_TOKEN`
  (`scripts/publish-packages.mjs`).

If a release fails partway, rerun the workflow: versions already in the registry
are skipped and the rest are published. Registry errors other than "not found"
(for example an expired token) stop the release rather than being skipped.

A version can be published only once. To fix a bad release, publish a new patch
version. `release:version` and `release:check` accept only valid SemVer
(`major.minor.patch` with an optional prerelease such as `-rc.1`, no build
metadata). Use a prerelease version (for example `0.2.0-rc.1`) for pilot builds
you may replace.

To preview what will be published without publishing:

```bash
npm run build && npm publish --dry-run ./packages/bar-chart
```

## Install in another project

Installing from GitHub Packages always needs a token, even for public packages.

1. Add an `.npmrc` next to the consumer's `package.json`:

   ```ini
   @mzebley-aem:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

2. Provide `NODE_AUTH_TOKEN`:
   - **Locally:** a GitHub personal access token (classic) with `read:packages`.
   - **GitHub Actions:** the workflow's `GITHUB_TOKEN` with `permissions: packages: read`.
     If that token can't read a package owned by another account, store a
     `read:packages` token as a repository secret instead.
   - **Docker builds:** pass the token as a build secret
     (`RUN --mount=type=secret,id=npm_token NODE_AUTH_TOKEN=$(cat /run/secrets/npm_token) npm ci`),
     not as a build argument, so it doesn't end up in an image layer.

3. Install:

   ```bash
   npm install @mzebley-aem/bar-chart
   ```

In server-rendered apps, register the elements through each package's `/loader`
entry (see the package READMEs).
