# Lernpfote 🐾

Lern-App für die Testvorbereitung (Klasse 8, Gymnasium Sachsen-Anhalt). Läuft im Browser auf iPhone und iPad und lässt sich über „Zum Home-Bildschirm“ wie eine App nutzen.

## Funktionen
- **Mathe Klasse 8:** 6 Themen mit 21 Fertigkeiten (Brüche, Terme & binomische Formeln, lineare Gleichungen, lineare Funktionen, Gleichungssysteme, Prozentrechnung). Die Aufgaben werden immer neu erzeugt, in 3 Schwierigkeitsstufen.
- **Lücken-Erkennung:** Für jede Fertigkeit wird ein Können-Wert geführt. Schwache Bereiche kommen öfter dran und werden auf der Startseite angezeigt.
- **Typische Fehler erkennen:** Zum Beispiel Vorzeichenfehler, Minus vor der Klammer, fehlendes Mittelglied bei binomischen Formeln, Nenner addiert oder nicht gekürzt. Zu jedem Fehler gibt es einen passenden Hinweis.
- **Schritt-für-Schritt-Aufgaben mit Probe:** Gegen das Überspringen von Schritten.
- **Testplaner:** Datum und Themen eintragen. Die App zeigt einen Countdown, wie gut sie vorbereitet ist, und ein Tagespensum.
- **Motivation:** XP, Ballett-Ränge, Abzeichen, Serien und ein Vergleich mit sich selbst (Woche gegen Vorwoche, Rekorde). Das Maskottchen ist die Katze Pirouette.
- **Notizblock:** Zum Rechnen mit Apple Pencil oder Finger.
- **Elternbericht:** Kann per „Teilen“ verschickt werden.

## Neues Fach hinzufügen
Lege nach dem Muster von `js/subjects/mathe.js` eine neue Datei an und trage sie in `js/subjects/index.js` ein.

## Tests
```
node tests/gen.test.js
```

Datenschutz: Alle Lerndaten bleiben im Browser des Geräts (localStorage). Im Code stehen keine persönlichen Daten.
