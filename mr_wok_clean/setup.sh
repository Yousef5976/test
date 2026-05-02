#!/bin/bash
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  🍜  Mr. Wok v3 — Quick Setup"
echo -e "${NC}"

# ── Node.js check ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${YELLOW}Installing Node.js...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
  sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✔ Node $(node -v)${NC}"

# ── Speed up npm ───────────────────────────────────────────────
echo -e "${YELLOW}Configuring npm for speed...${NC}"
npm config set cache ~/.npm-cache --global 2>/dev/null || true
npm config set prefer-offline true --global 2>/dev/null || true
npm config set fund false --global 2>/dev/null || true
npm config set audit false --global 2>/dev/null || true
echo -e "${GREEN}✔ npm configured${NC}"

# ── Install packages ───────────────────────────────────────────
echo -e "${YELLOW}Installing packages (first time may take 2-3 min, next time is instant)...${NC}"
npm ci --prefer-offline 2>/dev/null || npm install --prefer-offline
echo -e "${GREEN}✔ Packages installed${NC}"

# ── .env ───────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  printf "PORT=3000\nNODE_ENV=development\nJWT_SECRET=mrwok-secret-key\n" > .env
fi

echo -e "${GREEN}${BOLD}"
echo "  ✔ Ready! Run:  npm run dev"
echo ""
echo "  Customer:   http://localhost:3000"
echo "  Admin:      http://localhost:3000/admin   (mr.wok / 1234)"
echo "  Cook:       http://localhost:3000/cook"
echo "  Delivery:   http://localhost:3000/delivery"
echo -e "${NC}"
