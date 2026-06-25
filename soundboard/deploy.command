#!/bin/bash
# Move to the folder where this script is located
cd "$(dirname "$0")"

echo "-----------------------------------"
echo "🚀 SonicDeck Auto-Deploy to GitHub"
echo "-----------------------------------"

# Stage all files
git add .

# Prompt for a custom commit message or default to auto-update
echo "Enter commit message (or press Enter for default 'Auto update soundboard'):"
read msg
if [ -z "$msg" ]; then
    msg="Auto update soundboard"
fi

# Commit and Push
git commit -m "$msg"
git push

echo "-----------------------------------"
echo "✅ Changes pushed successfully! Vercel is now deploying..."
echo "-----------------------------------"

# Keep the window open for a few seconds to view the status
sleep 3
