Repository organization
=======================

What I did
----------
- Created a `services/` directory and moved backend microservice folders into it.
- Created an `apps/` directory and moved frontend-style apps (e.g., `frontend`, `ph7builder`, `zenith_production_ready`) into it.
- Left symlinks at the original top-level locations so existing relative paths (including `docker-compose.full.yml`) keep working.

Mapping (old -> new)
---------------------
- admin_audit -> services/admin_audit
- auth -> services/auth
- booking -> services/booking
- chat -> services/chat
- consent_logs -> services/consent_logs
- favorites -> services/favorites
- gdpr -> services/gdpr
- messaging -> services/messaging
- notification -> services/notification
- reviews -> services/reviews
- storage -> services/storage
- subscription -> services/subscription
- tags -> services/tags
- verification -> services/verification

- frontend -> apps/frontend
- ph7builder -> apps/ph7builder
- zenith_production_ready -> apps/zenith_production_ready

Why this is safe
-----------------
- Symlinks were created at the original locations. Any scripts or configs that reference the old paths will continue to work.
- The new layout simply groups related projects for easier navigation and future repository splitting.

If you want to split services into separate Git repositories
-----------------------------------------------------------
1. Make a backup branch first:

```bash
# From repo root
git checkout -b before-splitting
```

2. Use git subtree (preserves history for that subdirectory):

```bash
# Example: extract services/auth into its own branch
git subtree split -P services/auth -b split-auth

# Create a new remote repo (on GitHub/GitLab) and push the split branch there:
# git remote add auth-repo git@github.com:your-org/auth.git
# git push auth-repo split-auth:main
```

3. Alternatively use git-filter-repo (faster, more flexible) - install it then run:

```bash
git clone --no-local --no-hardlinks . ../auth-repo
cd ../auth-repo
git filter-repo --path services/auth --path-rename services/auth/:/ --force
# Now auth-repo contains only the auth project history
```

Notes and next steps
--------------------
- After splitting, update `docker-compose.full.yml` build contexts if you move folders outside this repo (or place new repo checkouts alongside this repo and update `build.context` accordingly).
- Consider removing the top-level symlinks if you fully migrate to separate repositories.
- Secure `ph7builder` installation: consider removing `_install/` and rotating any default passwords.

How to revert
-------------
- If anything goes wrong, you can restore from the `before-splitting` branch or remove the symlinks and move directories back:

```bash
# To restore to original structure
rm admin_audit && mv services/admin_audit ./admin_audit
# repeat for others
```

Questions
---------
- Do you want me to split any specific services into separate repos now? If yes, tell me which ones and whether you want me to push to remote repos (provide remote URLs).
- Do you want me to remove the `_install/` folder for `ph7builder` now for security, or keep it until you verify the site?

