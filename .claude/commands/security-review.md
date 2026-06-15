Führe ein Security Review des Hyrox Plan Projekts durch.

Prüfe folgende Bereiche:

1. **Authentifizierung & Session**
   - NextAuth-Konfiguration auf bekannte Schwachstellen
   - JWT-Handling, Session-Expiry, trustHost-Einstellung
   - Passwort-Hashing (bcrypt) korrekt konfiguriert?

2. **API-Routen**
   - Alle geschützten Routen prüfen: Ist `auth()` immer aufgerufen vor Datenbankzugriff?
   - Input-Validierung mit zod vollständig?
   - Keine SQL-Injection möglich (Prisma schützt, aber prüfen)?

3. **API-Key Handling**
   - `lib/crypto/encrypt.ts`: Verschlüsselung korrekt implementiert?
   - Kein API Key landet in Logs, Responses oder dem Git-Verlauf?
   - `ENCRYPTION_SECRET` und andere Secrets nicht in committetem Code?

4. **Abhängigkeiten**
   - `pnpm audit` ausführen und Ergebnis bewerten
   - Kritische oder high-severity Vulnerabilities identifizieren

5. **Middleware & Routing**
   - Alle schützenswerten Routen im middleware-Matcher?
   - Keine versehentlichen öffentlichen Endpunkte?

6. **Umgebungsvariablen**
   - `.env`, `.env.local`, `PROJEKT.md` in `.gitignore`?
   - Keine Secrets in `next.config.ts` oder anderen committierten Dateien?

Erstelle einen kompakten Bericht mit:
- ✅ Was ist in Ordnung
- ⚠️ Was sollte verbessert werden
- 🔴 Kritische Probleme (sofort beheben)

Wenn kritische Probleme gefunden werden, erstelle direkt einen Fix-Commit.
