#!/bin/bash
# Convert images to WebP format

IMAGE_DIR="$1"
if [ -z "$IMAGE_DIR" ]; then
  IMAGE_DIR="Source Data/d6holocron/images"
fi

cd "$IMAGE_DIR" || exit 1

echo "Converting images in: $(pwd)"
echo ""

count=0
for img in *.jpg *.png *.gif; do
  if [ -f "$img" ]; then
    webp="${img%.*}.webp"
    if convert "$img" "$webp" 2>/dev/null; then
      echo "✓ $img → $webp"
      rm "$img"
      count=$((count + 1))
    else
      echo "✗ Failed: $img"
    fi
  fi
done

echo ""
echo "Converted $count images to WebP"
