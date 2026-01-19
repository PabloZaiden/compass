#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO="PabloZaiden/compass"
VERSION="${COMPASS_VERSION:-}"
GH_TOKEN=""
USE_AUTH=false

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

# Check if repo is accessible (try to get latest release)
echo -e "${YELLOW}Checking repository access...${NC}"
LATEST_CHECK=$(curl -sI "https://github.com/${REPO}/releases/latest" | grep -i location | sed 's|.*/tag/||' | tr -d '\r\n')

if [ -z "$LATEST_CHECK" ]; then
    echo -e "${YELLOW}Public access unavailable, trying with GitHub authentication...${NC}"
    
    # Check if gh CLI is available and authenticated
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        GH_TOKEN=$(gh auth token)
        
        if [ -n "$GH_TOKEN" ]; then
            USE_AUTH=true
            # Try again with authentication using API
            LATEST_CHECK=$(curl -sH "Authorization: token ${GH_TOKEN}" \
                "https://api.github.com/repos/${REPO}/releases/latest" | \
                grep -o '"tag_name": *"[^"]*"' | sed 's/"tag_name": *"//;s/"//')
        fi
    fi
    
    if [ -z "$LATEST_CHECK" ]; then
        echo -e "${RED}Error: Could not access repository. GitHub CLI not available or not authenticated.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Successfully authenticated with GitHub.${NC}"
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

# Download the binary (use auth if required)
if [ "$USE_AUTH" = true ]; then
    echo -e "${YELLOW}Using authenticated download...${NC}"
    
    # For private repos, we need to get the asset ID from the API and download via API
    ASSET_ID=$(curl -sH "Authorization: token ${GH_TOKEN}" \
        "https://api.github.com/repos/${REPO}/releases/tags/${VERSION}" | \
        grep -B 3 "\"name\": \"${BINARY_NAME}\"" | \
        grep -o '"id": [0-9]*' | head -1 | sed 's/"id": //')
    
    if [ -z "$ASSET_ID" ]; then
        echo -e "${RED}Error: Could not find asset ${BINARY_NAME} in release ${VERSION}${NC}"
        exit 1
    fi
    
    API_DOWNLOAD_URL="https://api.github.com/repos/${REPO}/releases/assets/${ASSET_ID}"
    HTTP_STATUS=$(curl -sL -w "%{http_code}" -o "${TMP_DIR}/compass" \
        -H "Authorization: token ${GH_TOKEN}" \
        -H "Accept: application/octet-stream" \
        "$API_DOWNLOAD_URL")
else
    echo -e "${YELLOW}Using public download...${NC}"
    HTTP_STATUS=$(curl -sL -w "%{http_code}" -o "${TMP_DIR}/compass" "$DOWNLOAD_URL")
fi

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
