#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO="PabloZaiden/compass"
VERSION="${COMPASS_VERSION:-}"

# Detect OS
case "$(uname -s)" in
    Linux*)  OS="linux";;
    Darwin*) OS="darwin";;
    *)
        echo -e "${RED}Error: Unsupported operating system: $(uname -s)${NC}"
        exit 1
        ;;
esac

# Detect architecture
case "$(uname -m)" in
    x86_64)  ARCH="x64";;
    aarch64) ARCH="arm64";;
    arm64)   ARCH="arm64";;
    *)
        echo -e "${RED}Error: Unsupported architecture: $(uname -m)${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Detected OS: ${OS}, Architecture: ${ARCH}${NC}"

# Get the latest release version
echo -e "${YELLOW}Checking latest release...${NC}"
LATEST_CHECK=$(curl -sI "https://github.com/${REPO}/releases/latest" | grep -i location | sed 's|.*/tag/||' | tr -d '\r\n')

if [ -z "$LATEST_CHECK" ]; then
    echo -e "${RED}Error: Could not determine latest release from repository.${NC}"
    exit 1
fi

# Determine version to install
if [ -n "$VERSION" ]; then
    echo -e "${GREEN}Using specified version: ${VERSION}${NC}"
else
    VERSION="$LATEST_CHECK"
    echo -e "${GREEN}Latest release: ${VERSION}${NC}"
fi

# Construct download URL
BINARY_NAME="compass-${VERSION}-${OS}-${ARCH}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${BINARY_NAME}"

echo -e "${YELLOW}Downloading ${BINARY_NAME}...${NC}"

# Create temp directory for download
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Download the binary
HTTP_STATUS=$(curl -sL -w "%{http_code}" -o "${TMP_DIR}/compass" "$DOWNLOAD_URL")

if [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${RED}Error: Failed to download binary from ${DOWNLOAD_URL} (HTTP ${HTTP_STATUS})${NC}"
    exit 1
fi

# Make it executable
chmod +x "${TMP_DIR}/compass"

# Ensure target directory exists
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

# Copy the compiled binary
cp "${TMP_DIR}/compass" "$INSTALL_DIR/compass"
echo -e "${GREEN}Installed compass to $INSTALL_DIR/compass${NC}"

# Check if the directory is in PATH
if [[ ":$PATH:" == *":$INSTALL_DIR:"* ]]; then
    echo -e "${GREEN}You can now run 'compass' from anywhere.${NC}"
else
    echo ""
    echo -e "${YELLOW}Warning: $INSTALL_DIR is not in your PATH.${NC}"
    echo "Add the following line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo ""
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Then restart your shell or run 'source ~/.bashrc' (or equivalent)."
fi
