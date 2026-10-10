# Bank Empire

Piattaforma web per un'economia roleplay composta da imperi, valute, portafogli, aziende, marketplace e libro mastro.

## Versioni

Ogni versione ha il proprio branch numerato:

- [0.1](https://github.com/samix-14/Bank-Empire./tree/0.1): scheletro iniziale del progetto.
- [0.2](https://github.com/samix-14/Bank-Empire./tree/0.2): prima dashboard responsive e navigabile.
- [0.3](https://github.com/samix-14/Bank-Empire./tree/0.3): persistenza locale dei dati demo ed esportazione CSV.

## Avvio

Apri index.html in un browser moderno dal branch della versione desiderata. Il frontend usa HTML, CSS e JavaScript vanilla, senza dipendenze esterne.

## Funzioni presenti nella demo 0.3

- Dashboard con riepilogo e movimenti recenti.
- Portafogli multivaluta separati.
- Libro mastro con ricerca, filtri ed esportazione CSV.
- Marketplace con offerte dimostrative.
- Schede degli imperi e aliquote fiscali configurabili nella demo.
- Registro delle aziende.
- Salvataggio locale nel browser, se consentito.

## Limiti e sicurezza

Questo è un prototipo frontend. Non include autenticazione, database condiviso, verifica dei ruoli o pagamenti reali. I dati salvati nella versione 0.3 restano nel browser corrente e non vengono sincronizzati con altri utenti o dispositivi.

Prima di gestire un'economia condivisa, il backend dovrà convalidare ruoli e operazioni, eseguire trasferimenti in modo atomico e mantenere un libro mastro append-only. Le correzioni dovranno essere registrazioni compensative collegate, non modifiche retroattive delle transazioni. Le credenziali non devono mai essere conservate in chiaro.
