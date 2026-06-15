'use client'
import { useState, useEffect, useCallback } from 'react'
import { TestForm } from '@/components/bestandstest/TestForm'
import { TestHistory } from '@/components/bestandstest/TestHistory'

interface BestandsTestEntry {
  id: string; datum: string; kategorie: string; name: string; wert: number; einheit: string
}

export default function BestandstestPage() {
  const [tests, setTests] = useState<BestandsTestEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTests = useCallback(async () => {
    const res = await fetch('/api/bestandstest')
    if (res.ok) setTests(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchTests() }, [fetchTests])

  const handleDelete = async (id: string) => {
    await fetch(`/api/bestandstest?id=${id}`, { method: 'DELETE' })
    fetchTests()
  }

  return (
    <main className="max-w-2xl mx-auto p-4 pb-24 space-y-8">
      <h1 className="text-2xl font-bold">Bestandstest</h1>
      <section>
        <h2 className="text-lg font-semibold mb-3">Neuer Eintrag</h2>
        <TestForm onSuccess={fetchTests} />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Verlauf</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Lade…</p>
        ) : tests.length === 0 ? (
          <p className="text-muted-foreground text-sm">Noch keine Einträge.</p>
        ) : (
          <TestHistory tests={tests} onDelete={handleDelete} />
        )}
      </section>
    </main>
  )
}
