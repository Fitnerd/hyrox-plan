import { ProfilForm } from '@/components/onboarding/ProfilForm'

export default function OnboardingProfilPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Schritt 1 von 2</p>
          <h1 className="text-2xl font-bold">Dein Profil</h1>
        </div>
        <ProfilForm />
      </div>
    </div>
  )
}
