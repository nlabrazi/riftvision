#!/usr/bin/env python3
"""Importe les héros et cartes en français depuis une archive HeroesToolChest."""
import argparse
import html
import json
import re
from pathlib import Path
from zipfile import ZipFile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('archive', type=Path, help='Archive heroes-data-no-maps publiée par HeroesToolChest')
args = parser.parse_args()


def clean(value):
    if not isinstance(value, str):
        return ''
    value = re.sub(r'~~[^~]*~~', '', value)
    value = re.sub(r'<n\s*/>', '\n', value, flags=re.I)
    value = re.sub(r'<sp\s*/>', ' ', value, flags=re.I)
    value = re.sub(r'<[^>]*>', '', value)
    value = html.unescape(value).replace('\u00a0', ' ')
    return '\n'.join(' '.join(line.split()) for line in value.splitlines()).strip()


def filename(value):
    return value if isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_.-]+\.png', value) else None


with ZipFile(args.archive) as archive:
    files = archive.namelist()
    hero_files = [f for f in files if re.fullmatch(r'data/herodata_\d+\.json', f)]
    text_files = [f for f in files if re.fullmatch(r'gamestrings/gamestrings_\d+_frfr\.json', f)]
    map_files = [f for f in files if re.fullmatch(r'data/mapdata_\d+\.json', f)]
    map_text_files = [f for f in files if re.fullmatch(r'gamestrings/gamestrings_mapdata_\d+_frfr\.json', f)]
    if any(len(group) != 1 for group in (hero_files, text_files, map_files, map_text_files)):
        raise SystemExit('Archive invalide : données ou textes français des héros ou cartes manquants.')
    heroes = json.loads(archive.read(hero_files[0]))
    strings = json.loads(archive.read(text_files[0]))
    maps = json.loads(archive.read(map_files[0]))
    map_strings = json.loads(archive.read(map_text_files[0]))

version = heroes['meta']['heroesVersion']
if any(version != source['meta']['heroesVersion'] for source in (strings, maps, map_strings)) or not re.fullmatch(r'\d+\.\d+\.\d+\.\d+', version):
    raise SystemExit('Les versions des données et des textes ne correspondent pas.')
hero_text = strings['items']['hero']
ability_text = strings['items']['ability']
talent_text = strings['items']['talent']


def ability(entry, group, texts):
    key = entry.get('linkId', '')
    return {
        'id': key,
        'name': clean(texts['name'].get(key)),
        'description': clean(texts['fullText'].get(key)) or clean(texts['shortText'].get(key)),
        'icon': filename(entry.get('icon')),
        'slot': entry.get('abilityType', group),
    }


result = []
for identifier, hero in heroes['items'].items():
    if not re.fullmatch(r'[A-Za-z0-9]+', identifier):
        raise SystemExit(f'Identifiant de héros invalide : {identifier}')
    name = clean(hero_text['name'].get(identifier))
    if not name:
        raise SystemExit(f'Nom français manquant : {identifier}')
    abilities = []
    for group in ('Basic', 'Trait', 'Heroic'):
        for entry in hero.get('abilities', {}).get(group, []):
            item = ability(entry, group, ability_text)
            if item['name']:
                item['group'] = group
                abilities.append(item)
    talents = []
    for level, entries in hero.get('talents', {}).items():
        match = re.fullmatch(r'Level(\d+)', level)
        if not match:
            continue
        for entry in entries:
            item = ability(entry, level, talent_text)
            if item['name']:
                item['level'] = int(match.group(1))
                talents.append(item)
    portraits = hero.get('portraits', {})
    result.append({
        'id': identifier,
        'name': name,
        'title': clean(hero_text['title'].get(identifier)),
        'description': clean(hero_text['description'].get(identifier)),
        'lore': clean(hero_text['infoText'].get(identifier)),
        'role': clean(hero_text['expandedRole'].get(identifier)),
        'universe': hero.get('franchise', ''),
        'portrait': filename(portraits.get('heroSelect')),
        'art': filename(portraits.get('loading')),
        'abilities': abilities,
        'talents': talents,
    })

if not result:
    raise SystemExit('Aucun héros dans l’archive.')

map_text = map_strings['items']['map']
map_result = []
map_ids = set()
for key, entry in maps['items'].items():
    identifier = entry.get('normalizedId', '')
    if not re.fullmatch(r'[a-z0-9_]+', identifier) or identifier in map_ids:
        raise SystemExit(f'Identifiant de carte invalide ou dupliqué : {identifier}')
    map_ids.add(identifier)
    name = clean(map_text['name'].get(key))
    if not name:
        raise SystemExit(f'Nom de carte manquant : {key}')
    titles = map_text['objectiveTitle'].get(key, [])
    descriptions = map_text['objectiveDescription'].get(key, [])
    icons = entry.get('mapObjectives', [])
    objectives = []
    for index in range(max(len(titles), len(descriptions))):
        title = clean(titles[index]) if index < len(titles) else ''
        description = clean(descriptions[index]) if index < len(descriptions) else ''
        images = icons[index].get('icons', []) if index < len(icons) else []
        if title or description:
            objectives.append({
                'title': title,
                'description': description,
                'icons': [image for item in images if (image := filename(item.get('image')))],
            })
    map_result.append({
        'id': identifier,
        'name': name,
        'art': filename(entry.get('loadingScreenImage')),
        'preview': filename(entry.get('replayPreviewImage')),
        'objectives': objectives,
    })
if not map_result:
    raise SystemExit('Aucune carte dans l’archive.')
directory = Path(__file__).resolve().parent.parent / 'server/data'
directory.mkdir(parents=True, exist_ok=True)
middle = (len(result) + 1) // 2
for suffix, chunk in (('a', result[:middle]), ('b', result[middle:])):
    output = directory / f'hots-heroes-{suffix}.json'
    output.write_text(json.dumps({'version': version, 'locale': 'fr_FR', 'data': chunk}, ensure_ascii=False, indent=2) + '\n')
(directory / 'hots-maps.json').write_text(json.dumps({'version': version, 'locale': 'fr_FR', 'data': map_result}, ensure_ascii=False, indent=2) + '\n')
print(f'{len(result)} héros et {len(map_result)} cartes importés, version {version} : {directory}')
