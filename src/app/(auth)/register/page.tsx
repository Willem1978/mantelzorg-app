"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { AddressSearch, AddressInfo } from "@/components/ui/AddressSearch"
import { GerAvatar } from "@/components/GerAvatar"
import { useToast } from "@/components/ui/Toast"
import { authContent } from "@/config/content"

const c = authContent.register

export default function RegisterPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Stap 1: Account
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    // Stap 2: Jouw gegevens
    name: "",
    address: null as AddressInfo | null,
    // Stap 3: Naaste
    careRecipientName: "",
    careRecipientRelation: "",
    careRecipientAddress: null as AddressInfo | null,
    // Privacy
    privacyConsent: false,
    dataProcessingConsent: false,
  })

  // Valideer telefoonnummer: moet beginnen met 06 en 10 cijfers hebben
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    return /^06\d{8}$/.test(cleaned)
  }

  // Normaliseer telefoonnummer naar +31 formaat
  const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[\s-]/g, '')
    if (cleaned.startsWith('06')) {
      return '+31' + cleaned.substring(1)
    }
    return cleaned
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email) {
      setError(c.errors.emailVerplicht)
      return
    }

    if (formData.password.length < 8) {
      setError(c.errors.wachtwoordMin)
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError(c.errors.wachtwoordOngelijk)
      return
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      setError(c.errors.telefoonOngeldig)
      return
    }

    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError(c.errors.naamVerplicht)
      return
    }

    if (!formData.address) {
      setError(c.errors.adresVerplicht)
      return
    }

    setStep(3)
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.careRecipientName.trim()) {
      setError(c.errors.naasteNaamVerplicht)
      return
    }

    if (!formData.careRecipientRelation) {
      setError(c.errors.relatieVerplicht)
      return
    }

    if (!formData.careRecipientAddress) {
      setError(c.errors.naasteAdresVerplicht)
      return
    }

    if (!formData.privacyConsent || !formData.dataProcessingConsent) {
      setError(c.errors.voorwaardenVerplicht)
      return
    }

    setIsLoading(true)

    try {
      const phoneNumber = formData.phoneNumber ? normalizePhoneNumber(formData.phoneNumber) : undefined

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phoneNumber,
          // Eigen locatie
          street: formData.address?.straat,
          city: formData.address?.woonplaats,
          municipality: {
            code: "",
            name: formData.address?.gemeente || "",
            provinceCode: "",
            provinceName: "",
          },
          // Naaste info
          careRecipientName: formData.careRecipientName,
          careRecipientRelation: formData.careRecipientRelation,
          careRecipientStreet: formData.careRecipientAddress?.straat,
          careRecipientCity: formData.careRecipientAddress?.woonplaats,
          careRecipientMunicipality: formData.careRecipientAddress?.gemeente,
          // Privacy
          privacyConsent: formData.privacyConsent,
          dataProcessingConsent: formData.dataProcessingConsent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || c.errors.registratieFout)
      }

      // Automatisch inloggen na registratie
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        showSuccess(c.success.accountAangemaakt)
        router.push("/login?registered=true")
        return
      }

      showSuccess(c.success.welkom)
      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : c.errors.generic
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 1: return c.steps.account.title
      case 2: return c.steps.overJou.title
      case 3: return c.steps.overNaaste.title
      default: return ""
    }
  }

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return c.steps.account.subtitle
      case 2: return c.steps.overJou.subtitle
      case 3: return c.steps.overNaaste.subtitle
      default: return ""
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop: linker kolom met Ger en welkomstboodschap */}
      <div className="lg:w-1/2 lg:bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        {/* Mobiel: Header met Ger */}
        <div className="px-4 pt-8 pb-4 lg:p-0 lg:text-center lg:max-w-md">
          <div className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-6">
            <GerAvatar size="lg" className="lg:w-32 lg:h-32" />
            <div className="pt-2 lg:pt-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {getStepTitle()}
              </h1>
              <p className="text-muted-foreground mt-1 lg:mt-3 lg:text-lg">
                {getStepSubtitle()}
              </p>
            </div>
          </div>

          {/* Stappen indicator - nu in de linker kolom op desktop */}
          <div className="mt-4 lg:mt-8 flex justify-center lg:justify-center">
            <div className="ker-pill lg:text-base lg:px-6 lg:py-2">
              {c.progress(step)}
            </div>
          </div>
        </div>
      </div>

      {/* Rechter kolom / Content */}
      <div className="flex-1 lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
        <main className="px-4 pb-8 lg:px-0 lg:w-full lg:max-w-md">
          <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
            <div className="ker-card lg:shadow-lg">
            {error && (
              <div className="bg-[#FFEBEE] border-2 border-[#F44336] text-[#C62828] px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {/* STAP 1: Account gegevens */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    {c.form.emailLabel}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="ker-input"
                    placeholder={c.form.emailPlaceholder}
                    required
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.form.emailHelp}
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    {c.form.passwordLabel}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="ker-input"
                    placeholder={c.form.passwordMin}
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.form.passwordHelp}
                  </p>
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-foreground mb-2">
                    {c.form.passwordConfirmLabel}
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className="ker-input"
                    placeholder={c.form.passwordConfirmHelp}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                    {c.form.phoneLabel} <span className="text-muted-foreground font-normal">{c.form.phoneLabelOptional}</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="ker-input"
                    placeholder={c.form.phonePlaceholder}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.form.phoneHelp}
                  </p>
                </div>

                <button type="submit" className="ker-btn ker-btn-primary w-full">
                  {c.buttons.verder}
                </button>
              </form>
            )}

            {/* STAP 2: Eigen gegevens */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    {c.form.nameLabel}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="ker-input"
                    placeholder={c.form.namePlaceholder}
                    required
                    autoComplete="given-name"
                  />
                </div>

                <AddressSearch
                  label={c.form.addressLabel}
                  value={formData.address}
                  onChange={(address) => setFormData({ ...formData, address })}
                  placeholder={c.form.addressPlaceholder}
                />
                <p className="text-xs text-muted-foreground -mt-2">
                  {c.form.addressHelp}
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    {c.buttons.terug}
                  </button>
                  <button type="submit" className="ker-btn ker-btn-primary flex-1">
                    {c.buttons.verder}
                  </button>
                </div>
              </form>
            )}

            {/* STAP 3: Naaste gegevens */}
            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-4">
                <div>
                  <label htmlFor="careRecipientName" className="block text-sm font-medium text-foreground mb-2">
                    {c.form.careNameLabel}
                  </label>
                  <input
                    id="careRecipientName"
                    type="text"
                    value={formData.careRecipientName}
                    onChange={(e) => setFormData({ ...formData, careRecipientName: e.target.value })}
                    className="ker-input"
                    placeholder={c.form.careNamePlaceholder}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {c.form.careRelationLabel}
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">{c.form.careRelationHelp}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {c.relatieOpties.map((relatie) => (
                      <button
                        key={relatie}
                        type="button"
                        onClick={() => setFormData({ ...formData, careRecipientRelation: relatie })}
                        className={`px-3 py-3 rounded-xl border-2 text-sm transition-colors ${
                          formData.careRecipientRelation === relatie
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {relatie}
                      </button>
                    ))}
                  </div>
                </div>

                <AddressSearch
                  label={c.form.careAddressLabel}
                  value={formData.careRecipientAddress}
                  onChange={(address) => setFormData({ ...formData, careRecipientAddress: address })}
                  placeholder={c.form.careAddressPlaceholder}
                />
                <p className="text-xs text-muted-foreground -mt-2">
                  {c.form.careAddressHelp}
                </p>

                {/* Privacy */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-0.5 h-5 w-5 text-primary rounded border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      {c.privacy.akkoordPrefix}{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        {c.privacy.privacyregels}
                      </Link>{" "}
                      <span className="text-muted-foreground">{c.privacy.akkoordSuffix}</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.dataProcessingConsent}
                      onChange={(e) => setFormData({ ...formData, dataProcessingConsent: e.target.checked })}
                      className="mt-0.5 h-5 w-5 text-primary rounded border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      {c.privacy.gegevensGebruik}
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="ker-btn ker-btn-secondary flex-1"
                  >
                    {c.buttons.terug}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ker-btn ker-btn-primary flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        {c.buttons.bezig}
                      </span>
                    ) : (
                      c.buttons.klaar
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground lg:text-base">
                {c.footer.heeftAccount}{" "}
                <Link href="/login" className="text-primary font-medium hover:underline transition-colors">
                  {c.footer.login}
                </Link>
              </p>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
