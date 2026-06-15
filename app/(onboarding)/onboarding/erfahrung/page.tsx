import { ErfahrungForm } from '@/components/onboarding/ErfahrungForm'

export default function OnboardingErfahrungPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Schritt 3 von 3</p>
          <h1 className="text-2xl font-bold">Hyrox-Erfahrung</h1>
          <p className="text-muted-foreground mt-1">Hast du schon einen Hyrox gemacht?</p>
        </div>
        <ErfahrungForm />
      </div>
    </div>
  )
}
