# 🔍 Daily Data Scan & Supervision Sentinel

Ce document décrit le fonctionnement du **Daily Data Scan** de RiftVision, son architecture technique, les commandes CLI, les endpoints sécurisés et son intégration avec le cockpit DevOps **Sentinel** sur VPS Debian 12.

---

## 1. Objectifs & Fonctionnement

RiftVision agrège des catalogues, compétences et notes de patchs pour 5 jeux vidéo via des sources externes hétérogènes (DataDragon, API Riot/Valorant, scraping officiel Next.js, flux JSON Blizzard, catalogues JSON locaux).

Le **Daily Data Scan** s'exécute quotidiennement pour :
1. Détecter l'apparition de nouvelles versions de patch ou de nouveaux contenus.
2. Vérifier la disponibilité et l'intégrité de chaque source sans impacter les utilisateurs.
3. Conserver une empreinte canonique minimale afin d'éviter tout faux positif.
4. Produire un rapport standardisé et alimenter le cockpit **Sentinel** ainsi que les alertes Telegram.

---

## 2. États de Scan & Cycle de Vie

Chaque analyse attribue un statut global parmi quatre états normalisés :

| Statut | Description | Notification Telegram / Sentinel |
| :--- | :--- | :--- |
| **`OK`** | 100% des sources ont répondu, aucune modification constatée (ou initialisation de la baseline). | Archivé silencieusement, récapitulatif du bilan quotidien. |
| **`UPDATED`** | 100% des sources ont répondu, au moins une nouveauté a été détectée par rapport à la baseline. | Notification Telegram immédiate précisant les jeux et versions modifiés. |
| **`DEGRADED`** | Panne partielle : 1 à N-1 sources ont échoué (ex. timeout ou 503). | Notification d'avertissement avec diagnostic de la source indisponible. |
| **`ERROR`** | Panne totale (toutes les sources échouent) ou crash fatal du script. | Alerte critique Telegram, statut `failed` dans Sentinel. |

### Initialisation sans faux positif
Lors du tout premier scan (ou lorsqu'une nouvelle source est ajoutée sans snapshot préexistant), l'état est comptabilisé comme `OK` avec le message `Initialisation du snapshot pour cette source`. Les snapshots de référence sont enregistrés sans déclencher d'alerte Telegram intempestive de mise à jour.

### Persistance sélective
Si une source échoue lors d'un scan (état `DEGRADED`), son snapshot précédent est conservé intact dans `server/data/scan-snapshots.json`. Seules les sources ayant répondu avec succès voient leur empreinte mise à jour.

---

## 3. Stratégie d'empreinte canonique & Anti-Faux Positifs

Pour éliminer les faux positifs provoqués par l'ordre aléatoire des clés JSON ou les timestamps de rendu dynamique :
- **Hachage déterministe (`hasher.ts`)** : Les objets sont triés récursivement par clé avant hachage SHA-256 (tronqué à 16 caractères).
- **Extraction des métadonnées métier** :
  - **LoL / TFT** : Version DataDragon (`14.22.1`) + titre, URL et date du dernier article de patch.
  - **Valorant** : Liste triée et normalisée des couples `UUID:Nom` des agents jouables + dernier article de patch.
  - **WoW** : Titre, date et URL de la dernière note de mise à jour sur le flux officiel Blizzard.
  - **HotS** : Titre, date et URL du dernier article de patch Blizzard croisé avec la version du catalogue local.

---

## 4. Distinction Dynamique vs Action Manuelle (`syncMode`)

Chaque source dispose d'un attribut `syncMode` :
- **`automatic`** : Sources consommées à la volée par RiftVision (LoL, TFT, Valorant, WoW). Une nouveauté détectée est immédiatement disponible pour les utilisateurs après renouvellement du cache mémoire Nuxt.
- **`manual_action_required`** : Données gérées en fichiers statiques locaux (notamment le catalogue HotS dans `server/data/hots-heroes-*.json`).
  - Quand HotS passe à `UPDATED`, le rapport et le log Sentinel indiquent : `[ACTION REQUISE] Mettre à jour server/data/hots-*.json`.

---

## 5. Exécution en Ligne de Commande (CLI)

Le scan est exécutable de manière autonome en local ou sur serveur via `scripts/daily-scan.ts` :

```bash
# Exécution standard avec rendu console coloré
npm run scan:data

# Test sans écriture sur disque (dry-run)
npm run scan:data -- --dry-run

# Sortie JSON brute (utile pour scripts d'automatisation)
npm run scan:data -- --json

# Exécution avec mise à jour du payload Sentinel
npm run scan:data:sentinel

# Sauvegarde d'un rapport détaillé dans server/data/scan-report.json
npm run scan:data -- --report

# Personnalisation des chemins via flags CLI
npm run scan:data -- --storage-file /var/lib/riftvision/snapshots.json --report-file /var/log/scan-report.json
```

### Variables d'environnement pour la persistance
Les emplacements de stockage peuvent être personnalisés pour déporter les données hors de l'arborescence git :
- `SCAN_DATA_DIR` : Répertoire de base des données (par défaut : `server/data`).
- `SCAN_STORAGE_PATH` : Fichier des snapshots persistants (par défaut : `<SCAN_DATA_DIR>/scan-snapshots.json`).
- `SCAN_REPORT_PATH` : Fichier du dernier rapport détaillé (par défaut : `<SCAN_DATA_DIR>/scan-report.json`).
- `SENTINEL_STATUS_FILE` : Emplacement du fichier de statut Sentinel (par défaut : `sentinel/cron-status.json`).

### Codes de retour
- `0` : Scan réussi avec statut `OK` ou `UPDATED`.
- `1` : Scan en statut `ERROR` ou `DEGRADED` (sauf si le flag `--allow-degraded` est passé).

---

## 6. Endpoints API d'Administration (Nuxt / Nitro)

Pour déclencher ou consulter le scan via HTTP à distance :

### Configuration du secret (`.env`)
```bash
NUXT_SCAN_SECRET="votre-token-secret-aleatoire-32-chars"
```

### Endpoints disponibles
- **`POST /api/admin/scan`** : Déclenche le scan à la demande.
  - En-tête : `Authorization: Bearer <NUXT_SCAN_SECRET>` ou `x-scan-secret: <NUXT_SCAN_SECRET>`.
  - Body optionnel : `{ "persist": true, "withSentinel": true }`.
  - Retourne : le payload complet `ScanReport` en JSON.
- **`GET /api/admin/scan`** : Consulte l'état des derniers snapshots stockés sans solliciter le réseau externe.

---

## 7. Intégration sur le VPS Debian 12 & Sentinel

### Contrat Sentinel (`cron-status.json`)
Sentinel supervise les crons via `/srv/apps/riftvision/sentinel/cron-status.json` :

```json
{
  "cron_jobs": [
    {
      "name": "daily-data-scan",
      "command": "npm run scan:data",
      "schedule": "0 3 * * *",
      "last_execution_at": "2026-11-03T03:00:15Z",
      "last_status": "success",
      "last_duration": 2,
      "last_log": "Statut: UPDATED · LoL: OK | Valorant: UPDATED | WoW: OK | HotS: OK"
    }
  ]
}
```

### Wrapper Cron recommandé (`/srv/apps/riftvision/scripts/cron-scan.sh`)
```bash
#!/usr/bin/env bash
set -u

PROJECT_DIR="/srv/apps/riftvision"
cd "$PROJECT_DIR" || exit 1

# Exécution du scan avec mise à jour Sentinel et journalisation
npm run scan:data:sentinel -- --report
EXIT_CODE=$?

# Hook d'alerte Telegram (optionnel si non géré par Sentinel)
if [ $EXIT_CODE -ne 0 ]; then
  # Notification d'erreur vers Telegram
  echo "[RiftVision] Échec du Daily Data Scan"
fi

exit $EXIT_CODE
```

### Crontab système (`/etc/cron.d/riftvision-scan`)
```cron
# Exécution quotidienne à 03:00 UTC
0 3 * * * deploy /srv/apps/riftvision/scripts/cron-scan.sh > /dev/null 2>&1
```

