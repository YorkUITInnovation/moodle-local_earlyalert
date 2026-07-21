#!/bin/bash
# sync-all-plugins.sh
# Master sync script for all three York University Moodle plugins
# Syncs from enterprise repo branches to local mirror branches with fast-forward merge
# Usage:
#   ./sync-all-plugins.sh [--plugin <name>] [--into <branch>] [--push] [--cleanup]
#   ./sync-all-plugins.sh                          # sync all three plugins
#   ./sync-all-plugins.sh --plugin earlyalert      # sync only earlyalert
#   ./sync-all-plugins.sh --plugin organization --push --cleanup
#   ./sync-all-plugins.sh --into MOODLE_501_DEV --push --cleanup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Plugin configuration
declare -A PLUGINS=(
  [earlyalert]="git@github.com-work:ca-yorku-itinnovation/moodle-local_earlyalert.git"
  [organization]="git@github.com-work:ca-yorku-itinnovation/moodle-local_organization.git"
  [etemplate]="git@github.com-work:ca-yorku-itinnovation/moodle-local_etemplate.git"
)

# All plugins to sync by default
PLUGINS_TO_SYNC=(earlyalert organization etemplate)
TARGET_BRANCH=""
PUSH=false
CLEANUP=false
SELECTED_PLUGIN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --plugin)
      SELECTED_PLUGIN="$2"
      shift 2
      ;;
    --into)
      TARGET_BRANCH="$2"
      shift 2
      ;;
    --push)
      PUSH=true
      shift
      ;;
    --cleanup)
      CLEANUP=true
      shift
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      echo "Usage: $0 [--plugin <name>] [--into <branch>] [--push] [--cleanup]"
      exit 1
      ;;
  esac
done

# Validate plugin selection
if [[ -n "$SELECTED_PLUGIN" ]]; then
  if [[ ! -v PLUGINS[$SELECTED_PLUGIN] ]]; then
    echo -e "${RED}❌ Error: Unknown plugin '$SELECTED_PLUGIN'${NC}"
    echo "Available plugins: ${!PLUGINS[@]}"
    exit 1
  fi
  PLUGINS_TO_SYNC=($SELECTED_PLUGIN)
fi

# Check if git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Not in a git repository${NC}"
  exit 1
fi

# Determine target branch
if [[ -z "$TARGET_BRANCH" ]]; then
  TARGET_BRANCH=$(git branch --show-current)
  if [[ -z "$TARGET_BRANCH" ]]; then
    echo -e "${RED}❌ Error: Not on a branch (detached HEAD?)${NC}"
    exit 1
  fi
fi

# Show summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           ${YELLOW}Plugin Sync Summary${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Plugins to sync: $(IFS=, ; echo "${PLUGINS_TO_SYNC[*]}")"
echo -e "${BLUE}║${NC} Target branch: $TARGET_BRANCH"
echo -e "${BLUE}║${NC} Push after merge: $PUSH"
echo -e "${BLUE}║${NC} Cleanup remotes: $CLEANUP"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}❌ Error: Uncommitted changes detected${NC}"
  echo "   Stash or commit changes before syncing"
  exit 1
fi

# Checkout target branch once
echo -e "${YELLOW}🔀 Checking out target branch: $TARGET_BRANCH${NC}"
git checkout "$TARGET_BRANCH"
echo ""

# Sync each plugin
FAILED_PLUGINS=()
SYNCED_PLUGINS=()

for plugin in "${PLUGINS_TO_SYNC[@]}"; do
  remote_url="${PLUGINS[$plugin]}"
  temp_remote="temp_${plugin}_remote"

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}📦 Syncing plugin: $plugin${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Add temporary remote
  echo -e "${YELLOW}🔗 Adding remote: $temp_remote${NC}"
  if git remote get-url "$temp_remote" > /dev/null 2>&1; then
    echo "   (Remote already exists, using existing)"
  else
    git remote add "$temp_remote" "$remote_url"
  fi

  # Fetch from remote (default to main branch)
  echo -e "${YELLOW}⬇️  Fetching from remote...${NC}"
  if ! git fetch "$temp_remote" main 2>&1; then
    echo -e "${RED}❌ Failed to fetch $plugin${NC}"
    FAILED_PLUGINS+=("$plugin")
    git remote remove "$temp_remote" 2>/dev/null || true
    echo ""
    continue
  fi

  # Merge with fast-forward only
  echo -e "${YELLOW}🔀 Merging with fast-forward...${NC}"
  if git merge --ff-only "$temp_remote/main"; then
    echo -e "${GREEN}✅ $plugin synced successfully${NC}"
    SYNCED_PLUGINS+=("$plugin")
  else
    echo -e "${RED}❌ Merge failed for $plugin (not a fast-forward?)${NC}"
    FAILED_PLUGINS+=("$plugin")
    git remote remove "$temp_remote" 2>/dev/null || true
    echo ""
    continue
  fi

  # Clean up temporary remote if requested
  if $CLEANUP; then
    echo -e "${YELLOW}🧹 Removing temporary remote...${NC}"
    git remote remove "$temp_remote"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
  fi

  echo ""
done

# Push all synced plugins at once
if $PUSH && [[ ${#SYNCED_PLUGINS[@]} -gt 0 ]]; then
  echo -e "${YELLOW}📤 Pushing all changes to origin...${NC}"
  git push origin "$TARGET_BRANCH"
  echo -e "${GREEN}✅ Pushed to origin${NC}"
  echo ""
fi

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           ${YELLOW}Sync Complete${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"

if [[ ${#SYNCED_PLUGINS[@]} -gt 0 ]]; then
  echo -e "${BLUE}║${NC} ✅ Synced: $(IFS=, ; echo "${SYNCED_PLUGINS[*]}")"
else
  echo -e "${BLUE}║${NC} (no plugins synced)"
fi

if [[ ${#FAILED_PLUGINS[@]} -gt 0 ]]; then
  echo -e "${BLUE}║${NC} ❌ Failed: $(IFS=, ; echo "${FAILED_PLUGINS[*]}")"
fi

echo -e "${BLUE}║${NC} Branch: $TARGET_BRANCH"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show branch status
echo "Branch status:"
git branch -vv | grep "^\*"
echo ""
echo "Latest commits:"
git log --oneline --decorate -5

# Exit with error if any plugins failed
[[ ${#FAILED_PLUGINS[@]} -eq 0 ]] && exit 0 || exit 1

