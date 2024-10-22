#!/bin/sh

# Exit on error
set -e

# Function to get the current git tag
get_version() {
    # Try to get the most recent tag
    tag=$(git describe --tags --abbrev=0 2>/dev/null) || tag="v0.0.1"
    echo "$tag"
}

# Get the current version
VERSION=$(get_version)
# Remove the 'v' prefix if it exists
VERSION=${VERSION#v}

# Get the current date in ISO format
BUILD_DATE=$(date -u +%Y-%m-%d)
YEAR=$(date +%Y)

# Create the banner
BANNER="/*!
  * hjson v${VERSION} (https://github.com/alvarolm/hjson-js)
  * Copyright ${YEAR} Alvaro Leiva Miranda (https://github.com/alvarolm)
  * Licensed under MIT (https://github.com/alvarolm/hjson-js/blob/main/LICENSE.md)
  */
"

esbuild hjson.js --minify --bundle --format=esm --banner:js="$BANNER" --outfile=./dist/hjson.esm.min.js
esbuild hjson.js --minify --bundle --format=iife --global-name=hjson  --banner:js="$BANNER" --outfile=./dist/hjson.iife.min.js


echo "Built hjson version ${VERSION}"
