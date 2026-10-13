import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('build', exist_ok=True)

# 1. Installer Sidebar: 164 x 314 px
# Modern Dark Hextech theme
sidebar = Image.new('RGB', (164, 314), color=(9, 20, 40)) # #091428
draw = ImageDraw.Draw(sidebar)

# Gradient / geometric accent
for y in range(314):
    r = int(9 + (y / 314) * 8)
    g = int(20 + (y / 314) * 12)
    b = int(40 + (y / 314) * 20)
    draw.line([(0, y), (164, y)], fill=(r, g, b))

# Gold Hextech border on top and bottom
draw.rectangle([(0, 0), (163, 3)], fill=(200, 170, 110))
draw.rectangle([(0, 310), (163, 313)], fill=(200, 170, 110))

# Try to paste the app icon if available
try:
    icon = Image.open('public/favicon.ico')
    icon = icon.resize((64, 64), Image.Resampling.LANCZOS).convert('RGBA')
    sidebar.paste(icon, (50, 40), mask=icon)
except Exception as e:
    print(f"Could not load icon: {e}")

# Text banner
draw.text((82, 120), "RIFTVISION", fill=(240, 230, 210), anchor="mm")
draw.text((82, 140), "OVERLAY HUD", fill=(200, 170, 110), anchor="mm")
draw.line([(30, 155), (134, 155)], fill=(200, 170, 110), width=1)

draw.text((82, 220), "Compagnon", fill=(160, 180, 200), anchor="mm")
draw.text((82, 240), "In-Game", fill=(160, 180, 200), anchor="mm")
draw.text((82, 260), "League of Legends", fill=(160, 180, 200), anchor="mm")

sidebar.save('build/installer-sidebar.bmp', 'BMP')
print("Saved build/installer-sidebar.bmp")

# 2. Installer Header: 150 x 57 px
header = Image.new('RGB', (150, 57), color=(9, 20, 40))
draw_h = ImageDraw.Draw(header)
for y in range(57):
    r = int(9 + (y / 57) * 10)
    g = int(20 + (y / 57) * 15)
    b = int(40 + (y / 57) * 25)
    draw_h.line([(0, y), (150, y)], fill=(r, g, b))

draw_h.rectangle([(0, 54), (150, 56)], fill=(200, 170, 110))

try:
    icon_small = Image.open('public/favicon.ico')
    icon_small = icon_small.resize((36, 36), Image.Resampling.LANCZOS).convert('RGBA')
    header.paste(icon_small, (100, 10), mask=icon_small)
except Exception as e:
    print(f"Could not load icon: {e}")

header.save('build/installer-header.bmp', 'BMP')
print("Saved build/installer-header.bmp")

