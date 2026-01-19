#!/bin/bash

set -e

# Run compile
echo "Compiling..."
bun run compile

# Ensure target directory exists
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

# Copy the compiled binary
cp out/compass "$INSTALL_DIR/compass"
echo "Installed compass to $INSTALL_DIR/compass"

# Check if the directory is in PATH
if [[ ":$PATH:" == *":$INSTALL_DIR:"* ]]; then
    echo "You can now run 'compass' from anywhere."
else
    echo ""
    echo "Warning: $INSTALL_DIR is not in your PATH."
    echo "Add the following line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo ""
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Then restart your shell or run 'source ~/.bashrc' (or equivalent)."
fi
