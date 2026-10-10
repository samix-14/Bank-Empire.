# Bank Empire

Piattaforma web per un'economia roleplay composta da imperi, valute, portafogli, aziende, marketplace e libro mastro pubblico.

## Versioni

Ogni versione ha il proprio branch numerato: \`0.1\`, \`0.2\`, \`0.3\` e così via.

- **0.2**: prototipo responsive con dashboard, portafogli multivaluta, libro mastro, marketplace, imperi e aziende.
- **0.3**: persistenza locale dei dati demo e esportazione CSV del libro mastro.
- **0.4**: pagina Ruolo provvisoria e portafogli con operazioni demo.
- **0.5**: ricerche e filtri separati per pagina; pagina Ruolo lasciata in attesa delle specifiche dell’utente; correzione dell’esportazione CSV degli importi negativi.

## Avvio

Apri \`index.html\` in un browser moderno. Il frontend usa solo HTML, CSS e JavaScript vanilla e non richiede dipendenze esterne.

## Limiti importanti

Queste versioni sono prototipi frontend. Non hanno autenticazione sicura, database condiviso, gestione reale dei permessi o pagamenti. I dati delle versioni 0.3 e 0.4 vengono salvati nel browser corrente e non sono sincronizzati tra utenti o dispositivi.

La pagina Ruolo è un segnaposto finché non saranno definiti ruoli, password e autorizzazioni. La guida completa del sito è pianificata dopo la versione 1.0.

Prima di gestire un'economia condivisa, il backend dovrà convalidare ruoli e operazioni, eseguire trasferimenti in modo atomico e mantenere un libro mastro append-only. Le correzioni dovranno essere registrazioni compensative collegate, non modifiche retroattive delle transazioni.
