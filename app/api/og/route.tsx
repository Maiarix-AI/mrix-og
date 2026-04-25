import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const THEMES: Record<string, { bg: string; surface: string; text: string; sub: string; accent: string }> = {
  dawn:   { bg: '#f8f9fa', surface: '#eef1f5', text: '#1a3a5c', sub: '#5a7a9c', accent: '#e8600a' },
  noir:   { bg: '#080808', surface: '#141414', text: '#ffffff', sub: '#aaaaaa', accent: '#c9a84c' },
  ember:  { bg: '#1c0f07', surface: '#2a1a0e', text: '#ffffff', sub: '#c49a7a', accent: '#e8622a' },
  pearl:  { bg: '#fafaf8', surface: '#f0f0ec', text: '#1a1a1a', sub: '#666660', accent: '#b8860b' },
  onyx:   { bg: '#0a0a0a', surface: '#161616', text: '#ffffff', sub: '#999999', accent: '#c9a84c' },
  cobalt: { bg: '#0d1b2a', surface: '#152336', text: '#ffffff', sub: '#8aaabb', accent: '#4a9eff' },
}

const DEFAULT_THEME = THEMES.dawn

interface Project {
  name: string | null
  business_name: string | null
  logo_url: string | null
  hero_image_url: string | null
  style: string | null
  user_id: string | null
  city: string | null
  view_count: number | null
  whatsapp_number: string | null
}

interface Profile {
  full_name: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return new Response('Missing slug', { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_ANON_KEY!
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  }

  let project: Project | null = null
  let agentName: string | null = null

  try {
    const projectRes = await fetch(
      `${supabaseUrl}/rest/v1/projects?published_slug=eq.${encodeURIComponent(slug)}&select=name,business_name,logo_url,hero_image_url,style,user_id,city,view_count,whatsapp_number&limit=1`,
      { headers }
    )
    const rows: Project[] = await projectRes.json()
    project = rows[0] ?? null

    if (project?.user_id) {
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${project.user_id}&select=full_name&limit=1`,
        { headers }
      )
      const profiles: Profile[] = await profileRes.json()
      agentName = profiles[0]?.full_name ?? null
    }
  } catch {
    // render fallback branded image on fetch error
  }

  const theme = THEMES[project?.style ?? ''] ?? DEFAULT_THEME
  const title = project?.business_name || project?.name || 'Maiarix Landing Page'
  const city = project?.city ?? null
  const views = project?.view_count ?? null
  const waNumber = project?.whatsapp_number ?? null
  const heroUrl = project?.hero_image_url ?? null
  const logoUrl = project?.logo_url ?? null

  // Probe hero image — skip if Supabase returns x-robots-tag: none (storage auth issue)
  let heroSrc: string | null = null
  if (heroUrl) {
    try {
      const probe = await fetch(heroUrl, { method: 'HEAD' })
      if (probe.ok && probe.headers.get('x-robots-tag') !== 'none') {
        heroSrc = heroUrl
      }
    } catch {
      // ignore
    }
  }

  const hasHero = !!heroSrc
  const leftWidth = hasHero ? 65 : 100

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          fontFamily: 'sans-serif',
          background: theme.bg,
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: `${leftWidth}%`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '52px 56px',
            background: theme.bg,
            position: 'relative',
          }}
        >
          {/* Logo */}
          {logoUrl && (
            <img
              src={logoUrl}
              width={48}
              height={48}
              style={{ objectFit: 'contain', marginBottom: 20, borderRadius: 8 }}
            />
          )}

          {/* Business name */}
          <div
            style={{
              color: theme.text,
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-1px',
              marginBottom: 20,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>

          {/* City + view count */}
          {(city || views !== null) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: theme.sub,
                fontSize: 26,
                marginBottom: 24,
              }}
            >
              {city && <span>{city}</span>}
              {city && views !== null && <span>•</span>}
              {views !== null && <span>👁 {views.toLocaleString()} views</span>}
            </div>
          )}

          {/* Agent name */}
          {agentName && (
            <div
              style={{
                color: theme.accent,
                fontSize: 28,
                fontWeight: 600,
                marginBottom: waNumber ? 16 : 0,
              }}
            >
              {agentName}
            </div>
          )}

          {/* WhatsApp badge */}
          {waNumber && (
            <div style={{ display: 'flex' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#25d366',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '8px 20px',
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 22 }}>💬</span>
                <span>{waNumber}</span>
              </div>
            </div>
          )}

          {/* Accent bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 52,
              left: 56,
              right: 56,
              height: 3,
              background: theme.accent,
              borderRadius: 2,
            }}
          />

          {/* Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: 22,
              right: 56,
              color: theme.sub,
              fontSize: 18,
              opacity: 0.7,
            }}
          >
            Powered by Maiarix
          </div>
        </div>

        {/* Right panel — hero image */}
        {hasHero && (
          <div
            style={{
              width: '35%',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <img
              src={heroSrc!}
              width={420}
              height={630}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
