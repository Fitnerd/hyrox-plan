Führe ein Code Review der letzten Commits des Hyrox Plan Projekts durch.

Prüfe alle Commits seit gestern:

```
git log --since="yesterday" --oneline
git diff HEAD~1..HEAD
```

Falls keine neuen Commits: kurze Bestätigung ausgeben und fertig.

Falls neue Commits vorhanden, prüfe:

1. **Korrektheit**
   - Logikfehler oder off-by-one Fehler?
   - Edge Cases nicht behandelt?
   - TypeScript-Typen korrekt (kein unnötiges `any`)?

2. **Sicherheit**
   - Neue API-Routen: `auth()` aufgerufen?
   - User-Input validiert?
   - Keine Secrets im Code?

3. **Codequalität**
   - Unnötige Komplexität oder Duplikation?
   - Kommentare nur wo wirklich nötig?
   - Konsistenz mit dem restlichen Codebase (Prisma-Muster, Next.js App Router-Konventionen)?

4. **Projektspezifisches**
   - Prisma v7: Adapter-Pattern korrekt genutzt?
   - Next.js 15: Server/Client Components richtig getrennt?
   - Streaming-Antworten (SSE) korrekt abgeschlossen?

Ausgabe:
- Welche Commits wurden reviewed
- Konkrete Verbesserungsvorschläge (Datei + Zeilennummer)
- Lob für gute Entscheidungen (damit man weiß was beibehalten werden soll)

Keine Änderungen am Code vornehmen — nur Bericht.
