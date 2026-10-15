# Atelier du manuscrit — prototype 0.3

Une page HTML avec des modules JavaScript séparés, des données JSON complètes et des skills pour modifier le framework. L’interface est en français. L’importation et l’analyse s’effectuent dans le navigateur ; Flask sert uniquement les fichiers statiques.

## Démarrage local

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python server.py
```

Ouvrir http://127.0.0.1:5000 et cliquer sur **Ouvrir l’exemple**. Le serveur écoute uniquement sur localhost. Sous Windows, activer l’environnement avec `.venv\Scripts\activate`. Tout autre serveur HTTP statique peut également servir le même dossier. L’ouverture directe via `file://` n’est pas prise en charge : l’application utilise des modules ES, fetch et un Worker de type module.

## Corpus XML du dépôt

Le bouton **Ouvrir le corpus** charge les fichiers indiqués dans `xml-alto/manifest.json`. Le manifeste du dépôt répertorie les 152 vues du corpus complet (008–159) et le METS. Le bouton **Ouvrir l’exemple** reste limité aux dix vues de l’échantillon.

Pour utiliser un autre corpus :

1. Déposer les XML ALTO dans `xml-alto/`, avec un éventuel fichier METS.
2. Exécuter `npm run update-corpus-manifest` après chaque ajout ou suppression de XML, puis publier le manifeste actualisé avec les fichiers. La commande reconstruit la liste `files` de `xml-alto/manifest.json` avec tous les chemins XML, relatifs au manifeste. Les sous-dossiers sont acceptés ; les chemins absolus, les remontées `..` et les doublons sont refusés.
3. Déposer les images correspondantes dans `images/`, avec les noms indiqués dans les ALTO, ou les ajouter depuis l’interface.
4. Cliquer sur **Ouvrir le corpus** après publication des fichiers.

Exemple de manifeste :

```json
{"files":["FRAC34172_CC138_062.xml","METS.xml"]}
```

Le METS détermine l’ordre des documents lorsqu’il est présent ; sinon, les numéros physiques ALTO et les noms de fichiers sont utilisés. Le manifeste énumère les fichiers à charger : il ne remplace pas le METS. Le navigateur ne parcourt pas automatiquement les dossiers. Ajouter des images seules ne crée pas de nouvelles vues : les ALTO correspondants doivent figurer dans le manifeste. `npm test` vérifie que ce manifeste énumère tous les XML du dossier. La clé `corpusManifest` de `config.json` permet de choisir un autre manifeste ; sans cette clé, le bouton est masqué. Le chargement reste entièrement côté navigateur et fonctionne avec un serveur statique, y compris GitHub Pages. Si un fichier manque ou est invalide, le chargement échoue sans remplacer le projet ouvert.

Les imports ZIP et JSON restent disponibles. Les modifications s’enregistrent dans le projet JSON ou s’exportent en ALTO ; elles ne réécrivent pas les XML de `xml-alto/`.

## Premiers essais

1. Charger l’échantillon ou déposer une autre archive ZIP ALTO/METS : l’application n’impose aucune limite de dix vues numérisées.
2. La vue 062 s’ouvre si elle est présente, car l’échantillon contient son image. Sélectionner d’autres vues dans le menu.
3. Cliquer sur un mot pour voir toutes les occurrences de la forme ; cliquer sur la correspondance ou la source pour atteindre la ligne sur le fac-similé. La concordance conserve sa position de défilement, tandis que l’image reste visible à côté des résultats.
4. Utiliser +/−, la molette ou le pincement pour zoomer ; faire glisser pour se déplacer. Au clavier, dans le fac-similé : flèches pour se déplacer, +/− pour zoomer, Home pour la vue d’ensemble, L pour la ligne. Les coordonnées restent celles des lignes ALTO.
5. Activer **Afficher les lignes** pour comparer les extraits d’image des lignes dans la concordance. Les extraits longs défilent horizontalement ; un clic ouvre la ligne dans la visionneuse. Dans les contextes textuels, le gris signale les fragments provenant des lignes précédentes ou suivantes, tandis que le texte de la même ligne reste foncé.
6. Choisir **Expression régulière**, puis **Formes** ou **Texte des lignes**. Le premier mode recherche les formes originales et toutes leurs occurrences ; le second permet aussi de rechercher des espaces, de la ponctuation et des séquences de mots. Saisir le motif sans délimiteurs /…/ et les indicateurs séparément ; leur valeur initiale est gu. Les expressions régulières utilisent le texte original et le moteur JavaScript natif. Détails et exemples dans `docs/regex-search.md`.
7. Régler le contexte, la casse, les diacritiques, le préfixe, la région, la confiance et le tri. Les options de casse et de diacritiques des recherches littérales sont désactivées en mode regex, où les indicateurs explicites s’appliquent. **Confiance min.** filtre selon le WC original de la ligne. Les occurrences sont paginées, sans limite cachée sur le nombre de résultats.
8. Sélectionner une ligne, modifier son texte et appliquer : l’index et les concordances sont reconstruits. Le WC reste celui d’origine et est signalé comme tel.
9. Exporter le JSON complet, l’archive ZIP ALTO ou l’archive ZIP PAGE avec un rapport de conversion. Les XML originaux de l’échantillon ne sont pas modifiés.
10. **Enregistrer ici** sauvegarde un brouillon dans IndexedDB ; **Reprendre** le recharge dans le même navigateur, avec le même profil et à la même adresse. Les images ajoutées pendant la session ne sont pas incluses dans le brouillon JSON : les ajouter à nouveau ou les conserver à l’emplacement configuré. Le bouton JSON télécharge, quant à lui, un fichier transférable. Les infobulles sont accessibles au survol de la souris et lors de la prise de focus au clavier.

## Nouveautés de la version 0.3

- **Infobulles** active ou désactive les explications ; le choix est mémorisé.
- Des séparateurs déplaçables se trouvent entre les colonnes et sous les zones de lecture, de résultats, de lexique, d’édition et de fac-similé ; des poignées d’angle permettent de régler simultanément la largeur et la hauteur. Les séparateurs répondent également aux flèches du clavier. Un double clic réinitialise un séparateur ; **Réinitialiser les panneaux** réinitialise les dimensions enregistrées.
- **Formes ordonnées par fréquence** : bornes min./max. inclusives et bouton **Appliquer**, avec pagination de toutes les formes correspondantes.
- **Ajouter un onglet** : choisir un JSONL parmi ceux de `data/analyses/`, ou une couche personnelle conforme au contrat. Aucune couche d’analyse n’est préchargée. Les attributs et le nom proviennent des métadonnées ; leurs valeurs peuvent faire l’objet de recherches exactes, par préfixe ou par expressions régulières natives.
- Chaque couche conserve ses propres filtres, contexte, ordre, images et pagination. Les concordances textuelles restent indépendantes. Il est possible d’interroger les noms d’une famille tout en conservant la graphie effective ; dans le corpus complet, `Paris` compte 15 occurrences candidates, toutes sous la forme `paris`, dont six dans `aparis`.
- Les modifications mettent à jour les ancrages et invalident les analyses concernées. **À réanalyser** exporte les annotations avec le contexte actuel afin de les retraiter à l’extérieur de l’application. Le prototype n’effectue pas de réanalyse.
- Le JSON, le brouillon et la sauvegarde GitHub conservent toutes les couches chargées, les états et l’historique. Les exports ALTO/PAGE conservent leur contrat précédent.

Le contrat et les exemples figurent dans `docs/analysis-layers.md`. Les six JSONL couvrent l’œuvre entière (28 132 annotations), mais peuvent aussi être chargés avec les dix vues : les annotations des autres pages sont conservées en dehors du sous-ensemble. Les analyses fournies sont explicitement présentées comme des observations ou des candidats produits automatiquement ; elles ne constituent pas une édition validée sur le plan critique.

## Échantillon

Il comprend dix **vues numérisées**, souvent des doubles pages : 008, 019, 062, 068, 099, 115, 130, 138, 150, 158. Total : 775 lignes segmentées. Les ALTO sont identiques aux originaux ; le METS est réduit aux dix images, en conservant les identifiants et les numéros physiques d’origine. La vue 068 ne contient aucune ligne dans l’export ; cela ne permet pas de conclure que le manuscrit est vierge à cet endroit. L’échantillon comprend uniquement l’image `FRAC34172_CC138_062.jpg`. Les raisons de la sélection figurent dans `data/sample-selection.json`.

`data/sample-project.json` contient déjà la sérialisation complète des XML de l’échantillon : il peut être importé directement pour examiner et tester le contrat JSON.

## Modules

| Module | Fonction |
|---|---|
| `importer.js` | ZIP, ALTO, METS, ordre des documents et images |
| `xml.js` | Analyse syntaxique et sérialisation XML, échappement |
| `xmlalto.js` | ALTO ↔ modèle JSON complet |
| `model.js` | Vues à l’exécution, identifiants, structure, édition |
| `index.js` | Tokenisation et index positionnel des occurrences |
| `regex.js`, `regex-worker.js` | Moteur regex natif, périmètres de recherche, correspondances et annulation |
| `reader.js` | Lecture, mots sélectionnables et lignes |
| `concordance.js` | KWIC, tris et pagination |
| `facsimile.js` | Association des images et géométrie des lignes |
| `viewport.js` | Zoom, déplacement, limites et cadrages en coordonnées ALTO |
| `tooltips.js` | Explications au survol et au focus, prise en charge tactile |
| `editor.js` | Modification du texte de la ligne |
| `storage.js` | Téléchargement, ZIP et brouillon dans IndexedDB |
| `github.js` | Lecture du blob immuable et commit du JSON |
| `xmlpage.js` | Export PAGE documenté et vérifié |
| `anchors.js`, `analysis.js` | Ancrages, JSONL, index analytiques, validité et historique |
| `analysis-ui.js` | Onglets autonomes créés à partir des métadonnées |
| `layout.js`, `vocabulary.js` | Séparateurs, dimensions et intervalles de fréquence |
| `app.js` | Assemblage et interactions |

JSZip et xml-js sont inclus localement, avec leurs licences. Aucun CDN n’est utilisé à l’exécution. L’index positionnel est implémenté dans le framework : la recherche exacte accède aux listes d’occurrences ; les recherches par préfixe parcourent le vocabulaire. Les expressions régulières testent le vocabulaire original ou toutes les lignes dans un Worker pouvant être arrêté. `regexTimeoutMs` configure la durée maximale (initialement quatre secondes), sans réécrire les motifs ni imposer de limite au nombre de résultats. Les contextes traversent les lignes au sein d’une même vue ou région, sans réunir des documents non consécutifs.

## GitHub et Pages

La zone GitHub permet de charger et d’enregistrer **un projet JSON**. Saisir le propriétaire, le dépôt, la branche, le chemin et un jeton personnel disposant des permissions sur le dépôt. Le jeton reste uniquement dans la session et n’est inclus ni dans le JSON, ni dans IndexedDB, ni dans les fichiers téléchargés.

Pour mettre à jour un fichier existant, le charger d’abord depuis l’interface : l’enregistrement utilise le SHA de ce blob. Si le fichier change dans le dépôt, le système signale le conflit et conserve le travail en mémoire. Exporter le JSON avant de recharger. Le prototype n’effectue pas de fusion automatique. Si le chemin n’existe pas, le bouton crée le fichier. Un enregistrement dans le dépôt ne garantit pas la publication ultérieure sur Pages.

La branche doit autoriser les commits directs. Les tests du connecteur utilisent des réponses simulées : aucune écriture n’a été effectuée dans un dépôt réel. Le chargement d’archives ZIP ou d’images n’envoie aucun document au serveur ; l’écriture distante s’effectue uniquement via le bouton GitHub.

Pour Pages, publier les fichiers statiques du dossier. Le fichier `.nojekyll` est inclus. Ne pas publier l’environnement Python, `tests/out`, les identifiants de connexion ou les documents que l’on ne souhaite pas rendre accessibles. Flask n’est pas nécessaire sur Pages.

## Skills et personnalisation

Les skills du dossier `skills/` sont des instructions de développement du dépôt ; elles ne sont pas installées automatiquement dans le profil ChatGPT. Commencer par `build-workbench/SKILL.md`, qui coordonne les contrats. Les skills spécialisées concernent ALTO, PAGE, l’index, la lecture, les concordances, le fac-similé, la persistance, les couches d’analyse et la personnalisation des panneaux. Les maintenir à jour avec les modules.

Exemple d’intervention : « Utilise la skill present-concordances pour ajouter un regroupement choisi par l’utilisateur ; conserve la référence de chaque occurrence à sa ligne et vérifie qu’un clic ouvre le bon fac-similé ».

`config.json` règle le contexte, la pagination, les images, l’image privilégiée dans l’exemple et le délai maximal des expressions régulières. Le contrat du JSON et des occurrences figure dans `docs/model-contract.md`. La version 0.3 continue d’utiliser le schéma de projet JSON v1 : les projets des versions 0.1/0.2 restent chargeables, avec analysisLayers facultatif.

## Vérifications

Une version récente de Node.js est nécessaire pour les tests des modules, ainsi que Python avec lxml pour le schéma PAGE.

```bash
npm test
FULL_CORPUS_PATH=/percorso/export_completo.zip npm test
python tests/validate_exports.py
```

Les tests couvrent l’importation, l’aller-retour ALTO → JSON → ALTO, l’ordre METS, Unicode, les occurrences répétées, la modification et la réindexation, JSON, PAGE et GitHub simulé. La suite 0.2 vérifie également les expressions régulières natives avec groupes, captures et indices, assertions avant et arrière (lookaround), références arrière (backreferences), indicateurs g/i/m/s/y/u/v/d, correspondances de longueur nulle, Worker réel via un adaptateur Node, annulation et dépassement du délai maximal, rattachement des contextes aux lignes, géométrie du zoom, du déplacement et des extraits d’image, ainsi que les références des lignes affichées à l’aide d’une doublure de test du DOM. Ces tests ne remplacent pas la vérification des gestes et de la mise en page dans le navigateur.

Le rapport de cette exécution figure dans `docs/verification.json`. Les temps ont été mesurés avec Node.js dans l’environnement de test : ils ne constituent pas des mesures de performance du navigateur de l’utilisateur. Aucune vérification visuelle ou interactive dans un navigateur n’a été effectuée lors de cette livraison.

## Limites déclarées

- Un élément Page ALTO par fichier. Le nombre de fichiers est variable.
- La modification du texte est limitée aux lignes contenant un seul élément String, comme dans le corpus fourni. Les lignes contenant plusieurs éléments String restent consultables.
- Aucune géométrie n’est inventée pour les mots ; la localisation sur le fac-similé se fait à l’échelle de la ligne.
- Aucune inférence automatique des colonnes dans les blocs non classés. Pour la vue 158, l’ordre doit être vérifié sur l’image, qui n’est pas disponible dans l’échantillon.
- PAGE conserve le texte et la géométrie des lignes ; il ne reproduit pas tous les attributs ALTO et n’est pas présenté comme une conversion réversible. Le JSON conserve les originaux.
- Export JSON v1 et couches d’analyse JSONL ; recherche approximative non implémentée. Les expressions régulières sur le texte traitent une ligne ALTO à la fois ; les contextes KWIC peuvent traverser les lignes d’une même vue ou région.
- Les correspondances de mots et les expressions régulières sur le texte utilisent des décalages dans les caractères originaux ; sur le fac-similé, la localisation se fait toujours à l’échelle de la ligne, sans coordonnées de mots inventées.
- Les XML exportés conservent l’information structurelle, sans reproduire octet par octet la mise en forme des originaux.

### Vérification de la version 0.3

Exécuter `npm test`, ou `FULL_CORPUS_PATH=/percorso/archivio.zip npm test`. Les tests 0.3 vérifient les six couches sur l’échantillon et sur l’ensemble du corpus, les modifications et les dépendances, la conservation des enregistrements, JSON/JSONL, les expressions régulières sur les attributs, les fragments multiples et les intervalles de fréquence. Les rapports décrivent la vérification automatique dans Node et les éventuelles doublures du DOM : ils ne valident ni la mise en page, ni les gestes tactiles, ni IndexedDB, ni les écritures réelles sur GitHub dans le navigateur.
