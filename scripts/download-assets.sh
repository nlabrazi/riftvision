#!/usr/bin/env bash
set -e

# Create directories
mkdir -p public/assets/images
mkdir -p public/assets/icons/roles
mkdir -p public/assets/icons/stats
mkdir -p public/assets/icons/objectives

echo "Downloading League of Legends official assets..."

# Backgrounds & Textures
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/background.jpg" -o public/assets/images/background.jpg
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/hextech-lines-bg.png" -o public/assets/images/hextech-lines.png
curl -sL "https://ddragon.leagueoflegends.com/cdn/15.4.1/img/map/map11.png" -o public/assets/images/sr-map.png

# Role Icons
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png" -o public/assets/icons/roles/top.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png" -o public/assets/icons/roles/jungle.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png" -o public/assets/icons/roles/middle.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png" -o public/assets/icons/roles/bottom.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png" -o public/assets/icons/roles/utility.png

# Stats Icons
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/icon_gold.png" -o public/assets/icons/stats/gold.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/kills.png" -o public/assets/icons/stats/kills.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/icon_minions.png" -o public/assets/icons/stats/minions.png

# Objective Icons (Blue / Red)
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/tower-100.png" -o public/assets/icons/objectives/tower-blue.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/tower-200.png" -o public/assets/icons/objectives/tower-red.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/dragon-100.png" -o public/assets/icons/objectives/dragon-blue.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/dragon-200.png" -o public/assets/icons/objectives/dragon-red.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/baron-100.png" -o public/assets/icons/objectives/baron-blue.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/baron-200.png" -o public/assets/icons/objectives/baron-red.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/herald-100.png" -o public/assets/icons/objectives/herald-blue.png
curl -sL "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/herald-200.png" -o public/assets/icons/objectives/herald-red.png

echo "All League of Legends assets downloaded successfully!"
