import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Dein persönlicher<br />Hyrox-Trainingsplan
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          KI-generiert. Auf dich zugeschnitten. Bereit in 2 Minuten.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Jetzt starten — kostenlos</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Anmelden</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold mb-1">KI-Coach</h3>
            <p className="text-sm text-muted-foreground">Claude analysiert dein Profil und erstellt einen individuellen Plan</p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-1">Bestandstest</h3>
            <p className="text-sm text-muted-foreground">Tracke deinen Fortschritt mit regelmäßigen Tests</p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-semibold mb-1">Offline-fähig</h3>
            <p className="text-sm text-muted-foreground">Dein Plan ist immer verfügbar — auch ohne Internet</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">So funktioniert's</h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Profil anlegen', desc: 'Alter, Gewicht, Wettkampfdatum, Trainingstage' },
              { step: '2', title: 'Erfahrung angeben', desc: 'Erster Hyrox oder Vorjahresergebnisse eingeben' },
              { step: '3', title: 'Plan erhalten', desc: 'Claude erstellt deinen personalisierten Plan in Sekunden' },
            ].map(item => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-sm">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Bereit für deinen Hyrox?</p>
        <Button asChild size="lg">
          <Link href="/register">Plan erstellen →</Link>
        </Button>
      </section>
    </main>
  )
}
