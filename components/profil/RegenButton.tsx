'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function RegenButton() {
  const router = useRouter()

  return (
    <Button
      onClick={() => router.push('/onboarding/generieren')}
      variant="outline"
    >
      Plan neu generieren
    </Button>
  )
}
