# Livelli analitici — 0.3

Ogni **Ajouter un onglet** apre il selettore di un JSONL. Non sono previsti livelli predefiniti. Il primo record descrive il livello e i campi; seguono annotazioni indipendenti. Il tab **Texte** conserva le ricerche testuali. I tab analitici interrogano gli attributi, senza combinarli con le ricerche testuali. Ogni tab conserva query, campo, modo, stato, contesto, ordinamento, immagini e pagina dei risultati.

## Contratto minimo

```json
{"recordType":"metadata","format":"manuscript-analysis","version":1,"level":{"id":"my-level","label":"Mon analyse","fields":[{"path":"analysis.category","label":"Catégorie","valueType":"string"}]},"anchoring":{"unit":"utf16-code-unit","range":"half-open"}}
{"recordType":"annotation","id":"a1","targets":[{"document":"scan.xml","lineId":"line1","lineKey":"scan.xml#line1","start":0,"end":5,"quote":"Peire","lineSha256":"<sha256 du texte complet de la ligne UTF-8>"}],"analysis":{"category":"person"},"dependencies":[{"lineKey":"scan.xml#line1","lineSha256":"<même hash>"}],"status":{"analysis":"current","review":"unreviewed"}}
```

Les hashes doivent être calculés sur le texte exact de la ligne, pas sur une version normalisée. `start`/`end` sont des indices JavaScript UTF-16, borne de fin exclue; jamais des coordonnées image. Les cibles peuvent couvrir plusieurs lignes et des fragments discontinus. Une annotation produit une entrée de concordance, avec accès à **tous** ses fragments et images de lignes. L’ID doit être unique dans son fichier. Les champs déclarés sont des chemins dans `analysis`, librement extensible. Chaînes, nombres, booléens et tableaux sont indexés; les objets sont interrogés par leur sérialisation JSON. Aucun vocabulaire sémantique ni type NER n’est imposé par le lecteur.

Les sélections de valeur proposent les valeurs présentes dans le corpus courant et leur effectif. Une recherche exacte utilise un posting index; le préfixe parcourt les valeurs de l’attribut. Une regex utilise le Worker natif terminable, avec motif et flags inchangés, sur **les valeurs de l’attribut**. La forme de la concordance reste toujours celle du manuscrit. Les captures regex concernent l’attribut, pas les positions des caractères dans le manuscrit. La recherche vide exacte/préfixe affiche toutes les annotations disponibles du niveau; pour les regex, le motif vide reste un motif JavaScript natif.

## Corpus entier et échantillon

Les six JSONL dans `data/analyses/` concernent 152 scans et 9 604 lignes: entités candidates, formules, domaines lexicaux, montants, signes et renvois. Ils ne sont jamais chargés automatiquement. Choisir un de ces fichiers avec **Ajouter un onglet**. Sur l’échantillon de dix scans, les annotations des autres scans sont conservées et classées **hors du corpus chargé**. On vérifie les hashes des lignes effectivement présentes, sans rejeter un niveau entier à cause d’un hash global différent. Une ligne absente d’un document pourtant chargé est signalée comme manquante. Une annotation partiellement disponible reste conservée mais n’entre pas dans les concordances complètes.

Les exemples sont des observations ou candidats produits par des règles; «actuelle» signifie compatible avec la révision textuelle, **pas validée philologiquement**. Les métadonnées conservent méthode, provenance et degré de vérification. Le framework accepte également des analyses produites à l’extérieur par une IA ou un logiciel.

## Modification du texte

Le record importé, ses cibles et son analyse restent inchangés. Le projet conserve séparément `states` et un historique des edits. Les ancrages sont déplacés par un alignement des caractères (LCS, Unicode, positions UTF-16). Les correspondances non uniques sont marquées ambiguës. Les changements multiples dans une ligne sont traités ensemble. Une insertion avant le début décale le fragment; une insertion après la fin reste extérieure. Une insertion interne ou une substitution touche le fragment; une suppression totale retire son ancrage. Une ligne dont l’alignement nécessiterait plus de 2 millions de cellules devient ambiguë plutôt que bloquer l’interface.

Une modification d’un fragment invalide son analyse. Une modification d’une ligne déclarée dans `dependencies` invalide aussi l’interprétation, même si le fragment reste intact. Sans `dependencies`, les lignes des cibles sont utilisées par prudence; `dependencies: []` déclare explicitement une analyse ne dépendant que de ses fragments. Le système conserve séparément `anchor` (resolved/ambiguous/removed/missing/outside-subset) et `analysis` (current/needs-review). Il ne réanalyse rien et ne transforme jamais silencieusement l’identité de Peire en celle de John.

Les analyses à réexaminer sortent des résultats actuels. **Inclure celles à réexaminer** montre celles dont l’ancrage reste utilisable, avec leur ancienne analyse explicitement signalée. Les ambiguës/supprimées restent conservées et exportables, mais ne prétendent pas être des occurrences actuelles. **À réanalyser** exporte les records concernés, les cibles courantes, le texte des lignes dépendantes et l’historique. Le logiciel extérieur doit produire de nouveaux records, quotes, offsets et hashes sur le texte actuel; le nouveau JSONL s’importe dans un autre tab pour comparaison. Les anciens niveaux ne sont pas écrasés automatiquement.

Lorsqu’un ancien niveau est importé après des edits, les hashes permettent de rechercher la révision source dans l’historique et de rejouer les transformations. Si cette chaîne manque ou si le texte ne correspond pas, l’ancrage devient ambigu. Les états persistés peuvent aussi être rejoués par une chaîne d’edits exacte. Sans chaîne fiable, ils sont invalidés. Un ancrage ambigu ou supprimé le reste jusqu’à un nouveau niveau externe. Les dépendances absentes placent également l’annotation hors du sous-ensemble ou parmi les lignes manquantes.

## Sauvegarde

`project.analysisLayers` est une extension facultative du projet JSON v1: métadonnées, records originaux, états, historique et réglages par tab. Les projets 0.1/0.2 restent acceptés. JSON, IndexedDB et sauvegarde GitHub conservent les niveaux chargés; les caches, références runtime et images n’y entrent pas. **Exporter ce niveau** produit un JSONL conservant les records originaux et un champ `workbench` avec leurs états/historique, reconnu à la réimportation. Un niveau recalculé à l’extérieur doit omettre cet ancien état et fournir ses nouveaux ancrages.

## Module owners

- `anchors.js`: hash exact et déplacement conservateur des spans.
- `analysis.js`: validation JSONL, liaison au corpus, indices par ligne et attribut, propagation et export.
- `analysis-ui.js`: métadonnées, tabs et réglages autonomes.
- `concordance.js`: présentation des fragments et images, sans interpréter leur sémantique.
- `app.js`: composition, invalidation des requêtes et sauvegarde.
