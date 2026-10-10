# Bank Empire

Prototipo web per un'economia multivaluta. La versione 0.6 riparte da un nucleo ridotto e dà priorità al funzionamento.

## Pagine attuali

- **Portafoglio**: saldi del conto personale attivo per SOL, AUR e NVC; trasferimenti verso altri conti personali demo; controllo del saldo; movimenti recenti.
- **Imperi**: informazioni sugli imperi demo, fondi governativi e patrimonio complessivo per valuta.
- **Libro mastro**: elenco delle transazioni create dal Portafoglio.

## Struttura dei file

- `index.html`: struttura e navigazione delle tre pagine.
- `style.css`: stile responsive essenziale.
- `script.js`: dati demo, trasferimenti, controlli, calcolo dei totali, libro mastro e persistenza locale.
- `README.md`: documentazione del progetto.
- `CHANGELOG.md`: cronologia delle versioni.

## Regole del prototipo 0.6

- Un conto personale appartiene a un cittadino.
- I fondi governativi sono memorizzati separatamente e non fanno parte del conto personale del leader.
- Il patrimonio dell'impero è mostrato **per ciascuna valuta** come somma dei saldi personali dei cittadini associati all'impero più i fondi governativi nella stessa valuta.
- Non viene applicato alcun cambio valuta: non esiste ancora una formula concordata.
- Le transazioni implementate sono trasferimenti tra conti personali nella stessa valuta, senza commissioni. I fondi governativi non sono ancora destinatari o mittenti di transazioni.

## Avvio e limiti

Apri `index.html` in un browser moderno. Non servono dipendenze esterne.

È un prototipo frontend: i dati sono salvati in `localStorage` su questo browser. Non esistono login, backend o database condiviso, quindi più utenti non possono usare un'economia condivisa reale. Gli account e gli importi iniziali sono dati dimostrativi, non dati verificati.

## Versioni

- **0.1–0.5**: prototipi precedenti con altre sezioni dimostrative.
- **0.6**: riduzione a Portafoglio, Imperi e Libro mastro; separazione dei conti personali dai fondi governativi; trasferimenti locali con validazione di base.
