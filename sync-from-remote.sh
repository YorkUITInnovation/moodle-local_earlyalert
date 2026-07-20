#!/bin/bash
# sync-from-remote.sh
# Safely sync a branch from a remote repo into the current (or target) branch with fast-forward merge
# Usage:
#   ./sync-from-remote.sh <remote_url> <remote_branch> [--into <local_branch>] [--push] [--cleanup]
#   ./sync-from-remote.sh git@github.com-work:ca-yorku-itinnovation/moodle-local_earlyalert.git main --push --cleanup
#   ./sync-from-remote.sh git@github.com-work:ca-yorku-itinnovation/moodle-local_earlyalert.git july_fixes --into MOODLE_501_DEV --push --cleanup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
REMOTE_URL="${1:-}"
REMOTE_BRANCH="${2:-main}"
TARGET_BRANCH=""
PUSH=false
CLEANUP=false
TEMP_REMOTE="temp_sync_remote"

shift 2  # Skip first two positional args

while [[ $# -gt 0 ]]; do
  case $1 in
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
      shift
      ;;
  esac
done

# Validate inputs
if [[ -z "$REMOTE_URL" ]]; then
  echo -e "${RED}❌ Error: Remote URL required${NC}"
  echo "Usage: $0 <remote_url> <remote_branch> [--into <local_branch>] [--push] [--cleanup]"
  exit 1
fi

# Check if already in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Not in a git repository${NC}"
  exit 1
fi

# Determine which branch to use (current or specified target)
if [[ -z "$TARGET_BRANCH" ]]; then
  TARGET_BRANCH=$(git branch --show-current)
  if [[ -z "$TARGET_BRANCH" ]]; then
    echo -e "${RED}❌ Error: Not on a branch (detached HEAD?)${NC}"
    exit 1
  fi
fi

echo -e "${YELLOW}📋 Sync Plan:${NC}"
echo "  Target branch: $TARGET_BRANCH"
echo "  Remote URL: $REMOTE_URL"
echo "  Remote branch: $REMOTE_BRANCH"
echo "  Push after merge: $PUSH"
echo "  Cleanup remote: $CLEANUP"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}❌ Error: Uncommitted changes detected${NC}"
  echo "   Stash or commit changes before syncing"
  exit 1
fi

# Checkout target branch
echo -e "${YELLOW}🔀 Checking out target branch: $TARGET_BRANCH${NC}"
git checkout "$TARGET_BRANCH"

# Add temporary remote
echo -e "${YELLOW}🔗 Adding temporary remote...${NC}"
if git remote get-url "$TEMP_REMOTE" > /dev/null 2>&1; then
  echo "   (Remote already exists, using existing)"
else
  git remote add "$TEMP_REMOTE" "$REMOTE_URL"
fi

# Fetch from remote
echo -e "${YELLOW}⬇️  Fetching from remote...${NC}"
git fetch "$TEMP_REMOTE" "$REMOTE_BRANCH"

# Merge with fast-forward only
echo -e "${YELLOW}🔀 Merging with fast-forward...${NC}"
if git merge --ff-only "$TEMP_REMOTE/$REMOTE_BRANCH"; then
  echo -e "${GREEN}✅ Merge successful${NC}"
else
  echo -e "${RED}❌ Merge failed (not a fast-forward? Use 'git rebase' or 'git merge' manually)${NC}"
  git remote remove "$TEMP_REMOTE"
  exit 1
fi

# Push to origin if requested
if $PUSH; then
  echo -e "${YELLOW}📤 Pushing to origin...${NC}"
  git push origin "$TARGET_BRANCH"
  echo -e "${GREEN}✅ Pushed to origin${NC}"
fi

# Clean up temporary remote if requested
if $CLEANUP; then
  echo -e "${YELLOW}🧹 Removing temporary remote...${NC}"
  git remote remove "$TEMP_REMOTE"
  echo -e "${GREEN}✅ Cleanup complete${NC}"
fi

# Show final status
echo ""
echo -e "${GREEN}✨ Sync complete!${NC}"
echo ""
echo "Branch status:"
git branch -vv | grep "^\*"
echo ""
echo "Latest commits:"
git log --oneline --decorate -5

