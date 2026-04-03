# Release Process

This document describes how to release new versions of Openman.

## Overview

Openman uses automated GitHub Actions workflows to build and publish releases across all supported platforms:
- macOS (Apple Silicon & Intel)
- Windows
- Linux

## Two Release Methods

### Method 1: Tag-Based Auto-Release (Recommended)

This is the simplest method for releasing new versions.

**Steps:**
1. Update version in `package.json` and `src-tauri/tauri.conf.json`
2. Commit changes: `git commit -m "chore: bump version to x.x.x"`
3. Create and push tag: `git tag vx.x.x && git push origin vx.x.x`
4. GitHub Actions automatically:
   - Builds for all platforms
   - Creates draft release
   - Uploads all artifacts

**Example:**
```bash
# Update version to 1.0.0
npm version 1.0.0  # Updates package.json and creates commit/tag
git push origin v1.0.0
```

### Method 2: Manual GitHub Release

This method gives you control over release timing and notes.

**Steps:**
1. Update version in config files
2. Commit and push changes
3. Go to GitHub → Releases → "Draft a new release"
4. Choose or create tag (e.g., `v1.0.0`)
5. Fill in release title and description
6. Click "Publish release"
7. GitHub Actions automatically builds and uploads artifacts

## Release Workflow Details

The `release.yml` workflow triggers on:
- Push of version tags (`v*`)
- Manual release publication

**Build Matrix:**
| Platform | Runner | Architecture | Output Formats |
|----------|---------|--------------|----------------|
| macOS | macos-latest | aarch64 (ARM) | DMG, APP |
| macOS | macos-latest | x86_64 (Intel) | DMG, APP |
| Linux | ubuntu-22.04 | amd64 | AppImage, deb |
| Windows | windows-latest | x64 | MSI, EXE |

**Artifact Naming:**
Pattern: `Openman_{version}_{platform}_{arch}`
Examples:
- `Openman_1.0.0_macos_aarch64.dmg`
- `Openman_1.0.0_windows_x64-setup.exe`
- `Openman_1.0.0_linux_amd64.AppImage`

## Prerequisites

### Required Secrets

Configure these in GitHub repository settings → Secrets and variables → Actions:

1. **TAURI_PRIVATE_KEY** - Private key for signing Tauri bundles
2. **TAURI_KEY_PASSWORD** - Password for the private key

**Generate keys:**
```bash
npm run tauri signer generate
# Follow prompts to create key and password
# Add both as GitHub secrets
```

### Code Signing (Optional but Recommended)

For production releases, consider platform-specific signing:

- **macOS**: Apple Developer certificate for notarization
- **Windows**: Code signing certificate
- **Linux**: No signing required (AppImage is self-contained)

See [Tauri Distribution Guide](https://v2.tauri.app/distribute/) for details.

## Version Management

Openman uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** - Breaking changes
- **MINOR** - New features, backward compatible
- **PATCH** - Bug fixes

**Update version in both files:**
```json
// package.json
{
  "version": "1.0.0"
}

// src-tauri/tauri.conf.json
{
  "version": "1.0.0"
}
```

**Or use npm:**
```bash
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.1 → 0.2.0
npm version major  # 0.2.0 → 1.0.0
```

## Checking Build Status

1. Go to GitHub → Actions tab
2. Find the "Release" workflow run
3. Monitor build progress for each platform
4. All builds must succeed before release is published

**Typical build time:**
- macOS: 5-10 minutes per architecture
- Linux: 3-5 minutes
- Windows: 5-8 minutes

Total time: ~20-30 minutes for all platforms.

## Publishing the Draft Release

Tag-based releases create a **draft** release automatically.

**To publish:**
1. Go to GitHub → Releases
2. Find the draft release (marked as "Draft")
3. Review uploaded artifacts
4. Edit release notes if needed
5. Click "Publish release"

## Troubleshooting

### Build Fails on Specific Platform

**Check:**
1. Actions log for error details
2. Platform-specific dependencies installed correctly
3. Rust version compatibility
4. Tauri configuration valid

**Common issues:**
- Ubuntu: Missing `webkit2gtk-4.1-dev` or `patchelf`
- macOS: Missing Rust targets (`aarch64-apple-darwin`)
- Windows: Missing WebView2 (pre-installed on Win10/11)

### Missing Artifacts

**Check:**
1. Build job completed successfully
2. `tauri.conf.json` bundle settings configured
3. Secrets (TAURI_PRIVATE_KEY) properly set

### Release Not Triggering

**For tag-based:**
- Ensure tag starts with `v` (e.g., `v1.0.0`)
- Tag must be pushed to GitHub (not just local)

**For manual:**
- Release must be "published" (not just "created")
- Draft releases don't trigger workflow

## Best Practices

1. **Test before release:**
   - Run `npm run test:all` locally
   - Test build locally: `npm run tauri build`
   
2. **Write clear release notes:**
   - List new features
   - Document breaking changes
   - Include upgrade instructions
   
3. **Use draft releases:**
   - Review artifacts before publishing
   - Test downloads on each platform
   
4. **Maintain CHANGELOG:**
   - Track all changes per version
   - Link to relevant PRs/issues

5. **Version bump consistently:**
   - Update both `package.json` and `tauri.conf.json`
   - Use `npm version` for automation

## Related Documentation

- [CI Workflow](.github/workflows/ci.yml) - Testing and validation
- [Tauri Configuration](src-tauri/tauri.conf.json) - Build settings
- [Tauri Distribution](https://v2.tauri.app/distribute/) - Official docs
- [GitHub Actions](https://github.com/tauri-apps/tauri-action) - Tauri action reference