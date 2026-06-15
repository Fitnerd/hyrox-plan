'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      setLoading(false)
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
            <div><Label htmlFor="email">E-Mail</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="password">Passwort (min. 8 Zeichen)</Label><Input id="password" name="password" type="password" minLength={8} required /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Erstelle Konto…' : 'Registrieren'}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Bereits registriert? <Link href="/login" className="underline">Anmelden</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
