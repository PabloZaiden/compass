#!/usr/bin/env bash

set -e

# if bun is not installed, install it
if ! command -v bun &> /dev/null
then
    echo "Bun not found, installing..."
    
    curl -fsSL https://bun.com/install | bash

    # add bun to PATH
    export PATH="$HOME/.bun/bin:$PATH"
fi

# if there is no symlink for node, create it
if ! command -v node &> /dev/null
then
    # discover the bun binary location
    bunBinary=$(which bun)
    echo "Bun binary located at: $bunBinary"
    echo "Creating symlink for node to bun..."
    mkdir -p $HOME/.local/bin
    ln -sf "$bunBinary" "$HOME/.local/bin/node"
fi

export BUN_INSTALL_BIN=$HOME/.bun/bin
export BUN_INSTALL_GLOBAL_DIR=$HOME/.bun/global

# Ensure dirs exist and are owned by the current user
mkdir -p "$BUN_INSTALL_BIN" "$BUN_INSTALL_GLOBAL_DIR"
export PATH="$HOME/.bun/bin:$HOME/.bun/global/bin:${PATH}"

# add the paths to bashrc and zshrc
echo 'export PATH="$HOME/.bun/bin:$HOME/.bun/global/bin:${PATH}" ' >> $HOME/.bashrc
echo 'export PATH="$HOME/.bun/bin:$HOME/.bun/global/bin:${PATH}" '>> $HOME/.zshrc

# install zig
ZIG_VERSION="0.15.2"

ZIG_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
if [ "$ZIG_OS" = "darwin" ]; then
    ZIG_OS="macos"
fi

ZIG_ARCH=$(uname -m)
if [ "$ZIG_ARCH" = "aarch64" ] || [ "$ZIG_ARCH" = "arm64" ]; then
    ZIG_ARCH="aarch64"
fi

ZIG_URL="https://ziglang.org/download/$ZIG_VERSION/zig-$ZIG_ARCH-$ZIG_OS-$ZIG_VERSION.tar.xz"

echo "Zig download URL: $ZIG_URL"
echo "Download and extract zig..."
curl -fsSL $ZIG_URL -o /tmp/zig.tar.xz

echo "Zig downloaded to /tmp/zig.tar.xz, extracting..."
tar -xf /tmp/zig.tar.xz -C /tmp

echo "Move zig to $HOME/.local/zig..."
mkdir -p $HOME/.local/zig
mv /tmp/zig-$ZIG_ARCH-$ZIG_OS-$ZIG_VERSION/* $HOME/.local/zig/

echo "Add symlink for zig in $HOME/.local/bin..."
mkdir -p $HOME/.local/bin
ln -sf "$HOME/.local/zig/zig" "$HOME/.local/bin/zig"

# ensure $HOME/.local/bin is in PATH for current session and future shells
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
echo "Clean up temporary Zig files"
rm -f /tmp/zig.tar.xz
rm -rf "/tmp/zig-$ZIG_ARCH-$ZIG_OS-$ZIG_VERSION"

# install github copilot cli
bun install -g @github/copilot

# install openai codex cli
bun install -g @openai/codex

# install claude code
curl -fsSL https://claude.ai/install.sh | bash

# install google gemini cli
bun install -g @google/gemini-cli

# install az cli
if ! command -v az &> /dev/null
then
    echo "Azure CLI not found, installing..."
    
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi

# install opencode
curl -fsSL https://opencode.ai/install | bash

# add symlink for opencode in $HOME/.local/bin
mkdir -p $HOME/.local/bin
ln -sf "$HOME/.opencode/bin/opencode" "$HOME/.local/bin/opencode"