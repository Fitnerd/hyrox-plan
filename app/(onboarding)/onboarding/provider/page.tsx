import { ProviderForm } from '@/components/onboarding/ProviderForm'

export default function OnboardingProviderPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Schritt 1 von 3</p>
          <h1 className="text-2xl font-bold">KI-Anbieter wählen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Wähle deinen KI-Anbieter und trage deinen API Key ein. Damit erstellt die App deinen persönlichen Trainingsplan.
          </p>
        </div>
        <ProviderForm apiPath="/api/onboarding/provider" nextPath="/onboarding/profil" />
      </div>
    </div>
  )
}
