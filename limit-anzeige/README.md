# limit-anzeige

Claude-Code-Mod, die dein Nutzungslimit immer sichtbar macht:

- **Statuszeile** unter dem Prompt, z. B. `Limit: 5h 42% (Reset in 2h 30m) · 7T 18% (Reset in 3d 4h)` – aktualisiert sich automatisch, sobald sich ein Limit-Fenster bewegt.
- **Warnung** als Toast, wenn ein Fenster 80 % bzw. 95 % erreicht.
- **`/limit`** zeigt alle Fenster mit Balken und Reset-Zeit.

Die Werte stammen aus den Rate-Limit-Angaben der API-Antworten; sie gibt es nur bei Abo-Konten (Pro/Max/Team) und erst nach der ersten Antwort einer Sitzung.

## Installation

Ordner nach `~/.claude/dev-mods/<irgendwas>/limit-anzeige/` kopieren oder starten mit:

```
claude --plugin-dir ./limit-anzeige
```

Prüfen: `claude plugin validate limit-anzeige` und `claude plugin test limit-anzeige`.
