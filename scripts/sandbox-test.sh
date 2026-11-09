#!/usr/bin/env bash
# Deterministic Sandbox Test Runner (`scripts/sandbox-test.sh`)
# Agnostic, zero-lock-in, unprivileged sandbox execution using Bubblewrap (bwrap).
# Executes full test suite, deterministic benchmarks, and 18-check release gate inside isolated sandbox.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v bwrap >/dev/null 2>&1; then
  echo "🛡️  Bubblewrap (bwrap) detected. Running full verification inside isolated unprivileged sandbox..."
  
  # Run in Bubblewrap with read-only root, ephemeral tmpfs for temporary operations,
  # unshared process/IPC namespaces, and parent die-on-exit semantics.
  bwrap \
    --ro-bind / / \
    --dev /dev \
    --proc /proc \
    --tmpfs /tmp \
    --bind "$ROOT_DIR" "$ROOT_DIR" \
    --chdir "$ROOT_DIR" \
    --unshare-pid \
    --unshare-ipc \
    --die-with-parent \
    bash -c "
      set -e
      echo '=== [1/3] Running Full Test Suite inside Sandbox ==='
      npm run test:all
      echo ''
      echo '=== [2/3] Running Deterministic Benchmark Suite inside Sandbox ==='
      npm run benchmark
      echo ''
      echo '=== [3/3] Running 18-Check Release Gate Validation inside Sandbox ==='
      npm run validate:release
    "
    
  echo ""
  echo "✅ Sandbox Bubblewrap Test Execution PASSED 100%!"
else
  echo "ℹ️  Bubblewrap (bwrap) not detected on PATH. Running native full verification suite..."
  npm run test:all
  npm run benchmark
  npm run validate:release
  echo ""
  echo "✅ Native Test Execution PASSED 100%!"
fi
