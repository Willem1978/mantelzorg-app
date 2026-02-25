import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getScoreColors } from '@/config/colors'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const score = parseInt(searchParams.get('score') || '0')
  const level = searchParams.get('level') || 'LAAG'
  const name = searchParams.get('name') || ''

  // Bepaal kleuren op basis van niveau
  const niveauColors = getScoreColors(level)
  const bgColor = niveauColors.hex
  const textColor = niveauColors.hex
  const levelText = niveauColors.label

  let emoji = '💚'
  if (level === 'GEMIDDELD') {
    emoji = '🧡'
  } else if (level === 'HOOG') {
    emoji = '❤️'
  }

  // Bereken percentage voor de meter
  const percentage = Math.min(100, Math.round((score / 24) * 100))

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f8fafc',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <span style={{ fontSize: '28px', color: '#64748b' }}>
            Mantelzorg Balanstest
          </span>
        </div>

        {/* Score cirkel */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px',
            height: '200px',
            borderRadius: '100px',
            backgroundColor: bgColor,
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <span style={{ fontSize: '64px', fontWeight: 'bold' }}>{score}</span>
            <span style={{ fontSize: '24px', opacity: 0.9 }}>van 24</span>
          </div>
        </div>

        {/* Niveau */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '48px', marginRight: '15px' }}>{emoji}</span>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: textColor,
            }}
          >
            Belasting: {levelText}
          </span>
        </div>

        {/* Meter */}
        <div
          style={{
            display: 'flex',
            width: '400px',
            height: '24px',
            backgroundColor: '#e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: bgColor,
              borderRadius: '12px',
            }}
          />
        </div>

        {/* Naam als aanwezig */}
        {name && (
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              color: '#94a3b8',
            }}
          >
            Resultaat voor {name}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '20px',
            fontSize: '16px',
            color: '#cbd5e1',
          }}
        >
          MantelBuddy
        </div>
      </div>
    ),
    {
      width: 500,
      height: 500,
    }
  )
}
