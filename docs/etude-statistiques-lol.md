# Étude : builds et statistiques League of Legends

Étude réalisée le 31 octobre 2026 à partir de la documentation officielle Riot. Elle prépare la roadmap ; elle ne constitue ni une validation de Riot, ni une implémentation de collecte ou d'affichage de statistiques.

## Conclusion

Les données statiques déjà utilisées dans RiftVision décrivent les champions, objets et runes, mais ne fournissent pas à elles seules les taux de victoire observés, les affrontements ou les builds joués. Pour ces informations, une piste est d'agréger des parties terminées issues de l'API Riot. Il faut d'abord définir l'échantillon et obtenir un accès adapté à l'utilisation prévue ; les chiffres ne seraient pas représentatifs de toutes les parties par défaut.

## Sources et accès

| Source | Intérêt | Limites pour ce projet |
| --- | --- | --- |
| [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) | Noms, images et caractéristiques des champions, objets et runes, par version et langue. | Données statiques : elles ne constituent pas un historique de parties. La mise à jour après un patch peut être différée et la version peut varier selon la région. |
| [Riot Games API](https://developer.riotgames.com/apis), notamment `match-v5` | Piste pour obtenir l'historique et les détails de parties et construire des agrégats. | Nécessite une clé et une stratégie d'échantillonnage ; l'accès, les champs et les limites applicables restent à vérifier sur le portail pour le produit retenu. |
| [League API](https://developer.riotgames.com/apis) | Informations liées aux classements officiels, utiles à l'étude d'un échantillon classé. | Un classement consulté aujourd'hui ne prouve pas le rang d'un joueur au moment d'une partie passée. La méthode de sélection reste à définir. |

D'après la [documentation du portail](https://developer.riotgames.com/docs/portal), une clé de développement expire toutes les 24 heures. Une clé personnelle sert à un usage privé ou à une petite communauté privée ; Riot exclut son utilisation pour un produit public, y compris une bêta ouverte. Un produit public utilisant l'API doit demander une clé de production, généralement avec un prototype fonctionnel ; l'approbation et les quotas accordés restent à la discrétion de Riot.

Les limites d'appels peuvent aussi dépendre de la méthode ou du service. Le futur collecteur devra respecter les limites effectives et le délai indiqué en cas de réponse `429`, ainsi que protéger la clé côté serveur. Les hôtes diffèrent selon que l'API utilise un routage par plateforme ou par région : il faudra vérifier chaque méthode dans la [référence API](https://developer.riotgames.com/apis) et la [documentation LoL](https://developer.riotgames.com/docs/lol#routing-values).

## Périmètre et règles Riot

La [politique LoL](https://developer.riotgames.com/docs/lol#game-policy) cite les statistiques agrégées sans joueurs identifiés parmi les exemples d'usages de production. Cela ne vaut pas approbation automatique de RiftVision. Le produit et ses évolutions doivent être enregistrés et examinés selon les [règles générales](https://developer.riotgames.com/policies/general).

Riot interdit notamment d'afficher des taux de victoire pour les optimisations et objets du mode Arena. Sa politique demande aussi de préserver les choix des joueurs et limite les informations propres à une partie qui leur seraient autrement inconnues. Les parties personnalisées font l'objet de règles spécifiques. Pour une première étude, limiter le périmètre envisagé aux parties classées de la Faille de l'invocateur et exclure Arena et les parties personnalisées ; toute utilisation pendant une partie ou dans l'overlay devra être examinée séparément.

## Méthode à valider avant tout chiffre public

1. **Définir la population** : plateforme, file de jeu, période, version du jeu et éventuel filtre de rang. Documenter comment les joueurs et les parties sont sélectionnés et pourquoi ils ne représentent pas nécessairement tous les joueurs. Un rang relevé après la partie doit être présenté comme tel.
2. **Collecter de façon maîtrisée** : rechercher les identifiants de parties depuis un ensemble de comptes défini, dédupliquer chaque partie avant traitement, limiter les requêtes et prévoir reprise sur erreur et surveillance. La liste initiale et les critères de renouvellement doivent être décidés avant la collecte.
3. **Qualifier les données** : définir les parties exclues, la gestion des données incomplètes, des rôles ambigus et des versions. Conserver la version de la partie séparément de celle des fichiers Data Dragon utilisés pour l'affichage.
4. **Calculer des agrégats explicables** : par exemple, pour un champion et un périmètre donnés, taux de victoire = victoires / parties retenues ; afficher le nombre de parties correspondant. Ne pas afficher une valeur si le volume est insuffisant : le seuil et sa justification restent à définir.
5. **Présenter les limites** : indiquer la période, le patch, la région, la file, les éventuels filtres, la taille de l'échantillon et la date de mise à jour. Un faible nombre de parties ou un échantillon biaisé peut rendre une comparaison trompeuse.

Les affrontements demandent en plus une définition cohérente des adversaires et des rôles. Les builds exigent de décider ce qui est comparé : inventaire final, ordre d'achat, runes ou combinaison complète. Une victoire associée à un objet final ne prouve pas que cet objet a causé la victoire ; les parties longues et les achats incomplets peuvent biaiser la comparaison. Les objets disponibles et les règles changent aussi selon le patch.

## Proposition de lots ultérieurs

- Définir le périmètre exact, le public visé, les conditions de collecte et vérifier le statut du produit et de la clé Riot.
- Concevoir puis tester un prototype privé d'ingestion sur un petit jeu de données, avec limites d'appels, déduplication et reprise.
- Valider la qualité de l'échantillon et une définition reproductible des indicateurs avant de créer une API d'agrégats.
- Ajouter l'affichage dans les fiches champions avec les filtres, les volumes et les limites nécessaires, après validation du périmètre et des conditions Riot.

Aucun seuil statistique, volume de stockage, fréquence de collecte ou accord Riot n'est présumé par cette étude.
