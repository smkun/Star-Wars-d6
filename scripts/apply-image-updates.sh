#!/bin/bash
# SHELL SHIM: apply-image-updates.sh
# The original script performed Firestore writes and has been archived.
# To run it intentionally, set EXPLICIT_FIRESTORE_ACK=1 and invoke the archived copy.
if [ "$EXPLICIT_FIRESTORE_ACK" != "1" ]; then
  echo "This script has been archived to legacy_firestore_scripts/apply-image-updates.sh"
  echo "To run intentionally: EXPLICIT_FIRESTORE_ACK=1 bash legacy_firestore_scripts/apply-image-updates.sh"
  exit 1
fi

echo "Running archived script..."
bash "$(dirname "$0")/../legacy_firestore_scripts/apply-image-updates.sh" "$@"
