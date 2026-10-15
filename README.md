# Atelier du manuscrit — prototipo 0.3

Una pagina HTML con moduli JavaScript separati, dati JSON completi e skills per modificare il framework. L’interfaccia è in francese. Importazione e analisi avvengono nel browser; Flask serve soltanto i file statici.

## Avvio locale

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python server.py
```

Aprire http://127.0.0.1:5000 e premere **Ouvrir l’exemple**. Il server si lega soltanto a localhost. Su Windows attivare l’ambiente con `.venv\Scripts\activate`. In alternativa qualsiasi server HTTP statico può servire la stessa cartella. L’apertura diretta `file://` non è il percorso supportato: si utilizzano ES modules, fetch e un module Worker.

## Prime prove

1. Caricare il campione, oppure trascinare un altro ZIP ALTO/METS: non esiste alcun limite applicativo di dieci scansioni.
2. La scansione 062 viene aperta se presente, perché il campione contiene la sua immagine. Selezionare altre scansioni dal menu.
3. Cliccare una parola per vedere tutte le occorrenze della forma; cliccare la corrispondenza o la fonte per raggiungere la linea sul facsimile. La concordanza mantiene la propria posizione di scorrimento, mentre l’immagine rimane visibile accanto ai risultati.
4. Usare +/−, rotella o pinch per ingrandire; trascinare per spostarsi. Tastiera sul facsimile: frecce per pan, +/− per zoom, Home per la vista intera, L per la linea. Le coordinate rimangono quelle delle linee ALTO.
5. Attivare **Afficher les lignes** per confrontare i ritagli delle linee in concordanza. I ritagli lunghi scorrono orizzontalmente; il clic apre la linea nel visualizzatore. Il grigio nei contesti testuali identifica i frammenti provenienti da linee precedenti/successive, mentre il testo della stessa linea rimane scuro.
6. Scegliere **Expression régulière**, poi **Formes** o **Texte des lignes**. Sulla prima si cercano forme originali e tutte le loro occorrenze; sulla seconda anche spazi, punteggiatura e sequenze di parole. Pattern senza delimitatori /…/, flag separati; inizialmente gu. Le regex usano il testo originale e il motore JavaScript nativo. Dettagli ed esempi in `docs/regex-search.md`.
7. Regolare contesto, cassa, diacritici, prefisso, regione, confidenza e ordinamento. Cassa/diacritici delle ricerche letterali sono disabilitati in modalità regex, dove valgono i flag espliciti. **Confiance min.** filtra il WC originale della linea. Le occorrenze sono paginabili, senza un limite nascosto ai risultati.
8. Selezionare una linea, modificarne il testo e applicare: indice e concordanze vengono ricostruiti. Il WC rimane quello originario, dichiarato come tale.
9. Esportare il JSON completo, lo ZIP ALTO oppure lo ZIP PAGE con rapporto di conversione. Gli XML originali del campione non vengono modificati.
10. **Enregistrer ici** salva una bozza in IndexedDB; **Reprendre** la ricarica nello stesso browser/profilo/indirizzo. Le immagini aggiunte nella sessione non sono incluse nella bozza JSON: aggiungerle di nuovo o conservarle nel percorso configurato. JSON scarica invece un file trasferibile. I tooltip sono disponibili al passaggio del mouse e al focus da tastiera.

## Nuovo nella 0.3

- **Infobulles** attiva/disattiva le spiegazioni; la scelta viene ricordata.
- Giunture trascinabili tra colonne e sotto le aree di lettura, risultati, lessico, editor e facsimile; angoli per larghezza e altezza insieme. I separatori rispondono anche alle frecce della tastiera. Doppio clic ripristina una giuntura; **Réinitialiser les panneaux** ripristina le dimensioni salvate.
- **Formes ordonnées par fréquence**: min./max. inclusivi e **Appliquer**, con tutte le forme corrispondenti paginabili.
- **Ajouter un onglet**: scegliere un JSONL fra quelli di `data/analyses/`, oppure un proprio livello conforme. Nessun livello analitico precaricato. Attributi e nome derivano dai metadati; ricerche esatte, prefissi e regex native sui loro valori.
- Ogni livello mantiene i propri filtri, contesto, ordine, immagini e paginazione. Le concordanze testuali restano indipendenti. Si possono interrogare i nomi di una famiglia conservando la grafia effettiva; nel corpus completo `Paris` ha 15 occorrenze candidate, tutte `paris`, incluse sei in `aparis`.
- Gli edit aggiornano gli ancoraggi e invalidano le analisi coinvolte. **À réanalyser** esporta le annotazioni con il contesto attuale per rielaborarle esternamente. Il prototipo non effettua rianalisi.
- JSON/bozza/GitHub conservano tutti i livelli caricati, gli stati e la storia. Gli export ALTO/PAGE mantengono il loro contratto precedente.

Il contratto e gli esempi sono in `docs/analysis-layers.md`. I sei JSONL coprono l’opera intera (28 132 annotazioni), ma si caricano anche con le dieci scansioni: le annotazioni delle altre pagine restano conservate fuori dal sottoinsieme. Le analisi fornite sono osservazioni/candidati automatici dichiarati, non un’edizione criticamente validata.

## Campione

Sono dieci **scansioni**, spesso doppie pagine: 008, 019, 062, 068, 099, 115, 130, 138, 150, 158. Totale: 775 linee segmentate. Gli ALTO sono identici agli originali; il METS è ridotto alle dieci immagini, conservando ID e numeri fisici originari. La 068 è priva di linee nell’export; questo non certifica che il manoscritto sia bianco. Il campione include soltanto `FRAC34172_CC138_062.jpg`. Motivi della selezione in `data/sample-selection.json`.

`data/sample-project.json` contiene già la serializzazione completa degli XML del campione: può essere importato direttamente per ispezionare e provare il contratto JSON.

## Moduli

| Modulo | Funzione |
|---|---|
| `importer.js` | ZIP, ALTO, METS, ordine dei documenti e immagini |
| `xml.js` | Parsing e serializzazione XML, escaping |
| `xmlalto.js` | ALTO ↔ modello JSON completo |
| `model.js` | Viste runtime, ID, struttura, editing |
| `index.js` | Tokenizzazione e indice posizionale delle occorrenze |
| `regex.js`, `regex-worker.js` | Motore regex nativo, ambiti, match e cancellazione |
| `reader.js` | Lettura, parole selezionabili e linee |
| `concordance.js` | KWIC, ordinamenti e paginazione |
| `facsimile.js` | Associazione delle immagini e geometria delle linee |
| `viewport.js` | Zoom, pan, limiti e inquadrature in coordinate ALTO |
| `tooltips.js` | Spiegazioni con hover/focus e supporto touch |
| `editor.js` | Modifica del testo della linea |
| `storage.js` | Download, ZIP e bozza in IndexedDB |
| `github.js` | Lettura del blob immutabile e commit del JSON |
| `xmlpage.js` | Esportazione PAGE dichiarata e verificata |
| `anchors.js`, `analysis.js` | Ancoraggi, JSONL, indici analitici, validità e storia |
| `analysis-ui.js` | Tabs autonomi creati dai metadati |
| `layout.js`, `vocabulary.js` | Giunture, dimensioni e intervalli di frequenza |
| `app.js` | Composizione e interazioni |

JSZip e xml-js sono inclusi localmente, con licenze. Nessun CDN a runtime. L’indice posizionale è implementato nel framework: la ricerca esatta accede alle liste delle occorrenze; i prefissi esplorano il vocabolario. Le regex testano il vocabolario originale o tutte le linee in un Worker terminabile. `regexTimeoutMs` configura il tempo massimo (inizialmente quattro secondi), senza riscrivere pattern o imporre un limite ai risultati. I contesti attraversano le linee entro la stessa scansione/regione, senza unire documenti non consecutivi.

## GitHub e Pages

L’area GitHub permette di caricare e salvare **un progetto JSON**. Inserire proprietario, repository, branch, percorso e token personale con permessi sul repository. Il token rimane soltanto nella sessione e non entra nel JSON, in IndexedDB o nei file scaricati.

Per aggiornare un file esistente, caricarlo prima dall’interfaccia: il salvataggio usa lo SHA di quel blob. Se cambia sul repository, il sistema segnala il conflitto e conserva il lavoro in memoria. Esportare il JSON prima di ricaricare. Il prototipo non esegue fusioni automatiche. Se il percorso non esiste, il pulsante crea il file. Un salvataggio sul repository non certifica la successiva pubblicazione su Pages.

Il ramo deve consentire i commit diretti. Le prove del connettore usano risposte simulate: nessuna scrittura è stata eseguita su un repository reale. Il caricamento di ZIP/immagini non invia materiali al server; la scrittura remota avviene soltanto tramite il pulsante GitHub.

Per Pages pubblicare i file statici della cartella. `.nojekyll` è incluso. Non pubblicare l’ambiente Python, `tests/out`, credenziali o materiali che non si desiderano rendere accessibili. Non serve Flask su Pages.

## Skills e personalizzazione

Le skills sotto `skills/` sono istruzioni di sviluppo del repository, non sono installate automaticamente nel profilo ChatGPT. Iniziare da `build-workbench/SKILL.md`, che coordina i contratti. Le skills specializzate riguardano ALTO, PAGE, indice, lettura, concordanze, facsimile, persistenza, livelli analitici e personalizzazione dei pannelli. Mantenerle aggiornate insieme ai moduli.

Esempio di intervento: «Usa la skill present-concordances per aggiungere un raggruppamento scelto dall’utente; conserva il riferimento di ogni occorrenza alla linea e verifica che il clic apra il facsimile corretto».

`config.json` regola contesto, paginazione, immagini, immagine preferita nell’esempio e timeout delle regex. Il contratto del JSON e delle occorrenze è in `docs/model-contract.md`. La 0.3 continua a usare lo schema progetto JSON v1: i progetti della 0.1/0.2 restano caricabili, con analysisLayers facoltativo.

## Verifiche

Serve Node.js moderno per le prove dei moduli e Python con lxml per lo schema PAGE.

```bash
npm test
FULL_CORPUS_PATH=/percorso/export_completo.zip npm test
python tests/validate_exports.py
```

Le prove esercitano importazione, ritorno ALTO → JSON → ALTO, ordine METS, Unicode, occorrenze ripetute, modifica e reindicizzazione, JSON, PAGE e GitHub simulato. La suite 0.2 verifica anche regex native con gruppi/catture/indici, lookaround, backreference, flag g/i/m/s/y/u/v/d, match a lunghezza zero, Worker reale tramite adattatore Node, cancellazione e timeout, appartenenza dei contesti alle linee, geometria di zoom/pan e ritagli, riferimenti delle righe renderizzate con un test double DOM. Queste prove non sostituiscono la verifica dei gesti e del layout nel browser.

Il rapporto di questa esecuzione è in `docs/verification.json`. Tempi misurati con Node.js nell’ambiente di prova: non sono benchmark del browser dell’utente. Non è stata eseguita una verifica visiva/interattiva in un browser durante questa consegna.

## Limiti dichiarati

- Una Page ALTO per file. Il numero di file è variabile.
- Editing del testo solo per le linee con un singolo String, come nel corpus fornito. Più String restano consultabili.
- Nessuna geometria inventata per parole; sul facsimile si localizza la linea.
- Nessuna inferenza automatica di colonne nei blocchi non classificati. Nella 158 l’ordine va verificato sull’immagine, non disponibile nel campione.
- PAGE conserva testo e geometria delle linee; non riproduce tutti gli attributi ALTO e non è presentato come conversione reversibile. Il JSON mantiene gli originali.
- Esportazione JSON v1 e livelli analitici JSONL; ricerca fuzzy non implementata. Le regex sul testo lavorano su una linea ALTO alla volta; i contesti KWIC possono attraversare linee della stessa scansione/regione.
- I match di parola e le regex di testo hanno offset nei caratteri originali; sul facsimile viene sempre localizzata la linea, senza coordinate di parola inventate.
- Gli XML esportati conservano l’informazione della struttura, non la formattazione byte per byte degli originali.

### Verifica della 0.3

Eseguire `npm test`, oppure con `FULL_CORPUS_PATH=/percorso/archivio.zip npm test`. I test 0.3 verificano i sei livelli sul campione e sull’intero corpus, edit e dipendenze, conservazione dei record, JSON/JSONL, regex su attributi, più frammenti e intervalli di frequenza. I report descrivono la verifica automatica in Node e gli eventuali doppi DOM: non attestano layout, gesti touch, IndexedDB o scritture reali GitHub nel browser.
