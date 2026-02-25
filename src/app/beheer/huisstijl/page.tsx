"use client"

import { useEffect, useState, useRef } from "react"
import { AdminSpinner } from "@/components/admin"
import { useToast } from "@/components/ui/Toast"

// ============================================
// TYPES
// ============================================

interface Setting {
  id: string
  categorie: string
  sleutel: string
  waarde: string
  label: string | null
  type: string
  groep: string | null
  volgorde: number
}

type TabId = "branding" | "kleuren" | "teksten"

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "branding", label: "Branding & Logo", icon: "🎨" },
  { id: "kleuren", label: "Kleuren", icon: "🌈" },
  { id: "teksten", label: "Teksten", icon: "📝" },
]

// ============================================
// MAIN COMPONENT
// ============================================

export default function HuisstijlPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("branding")
  const [changes, setChanges] = useState<Record<string, string>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/beheer/huisstijl")
      const data = await res.json()
      if (!res.ok) {
        const detail = data.detail ? `: ${data.detail}` : ""
        setErrorMsg(`${data.error || "Fout bij laden"}${detail}`)
        showError(data.error || "Instellingen konden niet worden geladen")
        setSettings([])
        return
      }
      setSettings(data.settings || [])
      setChanges({})
    } catch (error) {
      console.error(error)
      setErrorMsg("Kon geen verbinding maken met de server")
      showError("Instellingen konden niet worden geladen")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (sleutel: string, waarde: string) => {
    setChanges((prev) => ({ ...prev, [sleutel]: waarde }))
  }

  const getValue = (sleutel: string): string => {
    if (sleutel in changes) return changes[sleutel]
    const setting = settings.find((s) => s.sleutel === sleutel)
    return setting?.waarde || ""
  }

  const hasChanges = Object.keys(changes).length > 0

  const handleSave = async () => {
    if (!hasChanges) return

    setSaving(true)
    try {
      const updates = Object.entries(changes).map(([sleutel, waarde]) => ({
        sleutel,
        waarde,
      }))

      const res = await fetch("/api/beheer/huisstijl", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })

      if (res.ok) {
        showSuccess("Instellingen opgeslagen!")
        // Update lokale state
        setSettings((prev) =>
          prev.map((s) =>
            s.sleutel in changes ? { ...s, waarde: changes[s.sleutel] } : s
          )
        )
        setChanges({})
      } else {
        showError("Opslaan mislukt")
      }
    } catch (error) {
      console.error(error)
      showError("Er ging iets mis bij het opslaan")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setChanges({})
  }

  // Filter settings per tab
  const tabSettings = settings.filter((s) => s.categorie === activeTab)

  // Groepeer per groep
  const groups: Record<string, Setting[]> = {}
  tabSettings.forEach((s) => {
    const groep = s.groep || "Overig"
    if (!groups[groep]) groups[groep] = []
    groups[groep].push(s)
  })

  if (loading) {
    return <AdminSpinner tekst="Huisstijl laden..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Huisstijl & Teksten</h1>
          <p className="text-gray-500 mt-1">Beheer het uiterlijk, de kleuren en teksten van de app</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-600 font-medium">
              {Object.keys(changes).length} wijziging{Object.keys(changes).length !== 1 ? "en" : ""}
            </span>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              Ongedaan maken
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content per groep */}
      <div className="space-y-6">
        {Object.entries(groups).map(([groep, items]) => (
          <div key={groep} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{groep}</h2>
            <div className="space-y-5">
              {items.map((setting) => (
                <SettingField
                  key={setting.sleutel}
                  setting={setting}
                  value={getValue(setting.sleutel)}
                  onChange={(val) => handleChange(setting.sleutel, val)}
                />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groups).length === 0 && !errorMsg && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">Geen instellingen in deze categorie</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl flex-shrink-0">&#9888;</span>
              <div>
                <h3 className="text-red-800 font-semibold">Fout bij laden instellingen</h3>
                <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
                <button
                  onClick={loadSettings}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Opnieuw proberen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <strong>{Object.keys(changes).length}</strong> onopgeslagen wijziging{Object.keys(changes).length !== 1 ? "en" : ""}
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                Ongedaan maken
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Opslaan..." : "Alle wijzigingen opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SETTING FIELD COMPONENT
// ============================================

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: Setting
  value: string
  onChange: (val: string) => void
}) {
  switch (setting.type) {
    case "color":
      return <ColorField setting={setting} value={value} onChange={onChange} />
    case "image":
      return <ImageField setting={setting} value={value} onChange={onChange} />
    case "textarea":
      return <TextareaField setting={setting} value={value} onChange={onChange} />
    default:
      return <TextField setting={setting} value={value} onChange={onChange} />
  }
}

// ── Text input ──
function TextField({
  setting,
  value,
  onChange,
}: {
  setting: Setting
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {setting.label || setting.sleutel}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="text-xs text-gray-400 mt-1">{setting.sleutel}</p>
    </div>
  )
}

// ── Textarea ──
function TextareaField({
  setting,
  value,
  onChange,
}: {
  setting: Setting
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {setting.label || setting.sleutel}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="text-xs text-gray-400 mt-1">{setting.sleutel}</p>
    </div>
  )
}

// ── Color picker ──
function ColorField({
  setting,
  value,
  onChange,
}: {
  setting: Setting
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {setting.label || setting.sleutel}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="#000000"
        />
        <div
          className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: value || "#000000" }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{setting.sleutel}</p>
    </div>
  )
}

// ── Image upload (logo) ──
function ImageField({
  setting,
  value,
  onChange,
}: {
  setting: Setting
  value: string
  onChange: (val: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return

    // Max 500KB
    if (file.size > 500 * 1024) {
      alert("Bestand is te groot. Maximaal 500KB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      onChange(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {setting.label || setting.sleutel}
      </label>

      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {value ? (
            <img src={value} alt="Logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-3xl text-gray-300">📷</span>
          )}
        </div>

        {/* Upload zone */}
        <div className="flex-1">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm text-gray-600">
              Sleep een afbeelding hierheen of <span className="text-blue-600 font-medium">klik om te uploaden</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG of SVG - max 500KB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />

          {value && (
            <button
              onClick={() => onChange("")}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Logo verwijderen
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">{setting.sleutel}</p>
    </div>
  )
}
