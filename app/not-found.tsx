import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl font-bold mb-4">404</p>
        <p className="text-xl text-muted-foreground mb-6">Seite nicht gefunden</p>
        <Button asChild>
          <Link href="/">Zurück zur Startseite</Link>
        </Button>
      </div>
    </main>
  )
}
