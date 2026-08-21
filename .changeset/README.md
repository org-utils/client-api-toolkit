# Changesets

This repo publishes `packages/server` (as `api-response-tsjs`) and
`packages/client` (as `client-api-kit`) **independently** - they are not
version-locked to each other. `updateInternalDependencies: "patch"` means
that if `packages/types` or `packages/errors` change, a patch bump is
generated for whichever of the two consumer packages depend on the changed
package, without forcing an unrelated version bump on the other.

Run `pnpm changeset` after any change, `pnpm version-packages` to apply
version bumps and changelogs, `pnpm publish-packages` to build and publish.
