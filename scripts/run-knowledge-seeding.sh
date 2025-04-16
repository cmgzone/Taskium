#!/bin/bash

# Knowledge Base Seeding Runner Script
#
# This script provides a simple way to run various knowledge seeding scripts
# for the AI assistant in the TSK Platform

# Color codes for better output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}   TSK Platform Knowledge Base Seeder   ${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Display menu
echo -e "${YELLOW}Select a knowledge seeding option:${NC}"
echo "1. Seed essential platform knowledge (minimal)"
echo "2. Seed complete platform knowledge (comprehensive)"
echo "3. Seed general knowledge and definitions"
echo "4. Seed real-world knowledge"
echo "5. Seed marketplace-specific knowledge"
echo "6. Seed token-specific knowledge"
echo "7. Seed all knowledge (complete process)"
echo "q. Quit"
echo ""

read -p "Enter your choice [1-7 or q]: " choice

case $choice in
  1)
    echo -e "${GREEN}Seeding essential platform knowledge...${NC}"
    npx tsx scripts/seed-essential-knowledge.ts
    ;;
  2)
    echo -e "${GREEN}Seeding complete platform knowledge...${NC}"
    npx tsx scripts/seed-complete-platform-knowledge.ts
    ;;
  3)
    echo -e "${GREEN}Seeding general knowledge and definitions...${NC}"
    npx tsx scripts/ai-seed-general-knowledge.ts
    ;;
  4)
    echo -e "${GREEN}Seeding real-world knowledge...${NC}"
    npx tsx scripts/seed-realworld-knowledge.ts
    ;;
  5)
    echo -e "${GREEN}Seeding marketplace-specific knowledge...${NC}"
    npx tsx scripts/seed-marketplace-knowledge.ts
    ;;
  6)
    echo -e "${GREEN}Seeding token-specific knowledge...${NC}"
    npx tsx scripts/seed-token-knowledge.ts
    ;;
  7)
    echo -e "${GREEN}Running complete knowledge seeding...${NC}"
    echo -e "${YELLOW}This may take some time. Please be patient.${NC}"
    
    echo -e "${CYAN}Step 1/4: Seeding essential platform knowledge${NC}"
    npx tsx scripts/seed-essential-knowledge.ts
    
    echo -e "${CYAN}Step 2/4: Seeding general knowledge and definitions${NC}"
    npx tsx scripts/ai-seed-general-knowledge.ts
    
    echo -e "${CYAN}Step 3/4: Seeding real-world knowledge${NC}"
    npx tsx scripts/seed-realworld-knowledge.ts
    
    echo -e "${CYAN}Step 4/4: Seeding specialized knowledge (marketplace & token)${NC}"
    npx tsx scripts/seed-marketplace-knowledge.ts
    npx tsx scripts/seed-token-knowledge.ts
    
    echo -e "${GREEN}Complete knowledge seeding finished!${NC}"
    ;;
  q|Q)
    echo -e "${YELLOW}Exiting knowledge seeder.${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid option. Please try again.${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}Knowledge seeding complete!${NC}"