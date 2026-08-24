/**
 * Minimal CORS relay for the (undocumented, unofficial) Pathé JSON API.
 *
 * Why this exists: pathe.fr's /api/* endpoints send no Access-Control-Allow-Origin header, so a
 * browser calling them directly from another origin (e.g. this app hosted on GitHub Pages) gets
 * blocked by CORS. This worker does nothing but forward a small allow-listed set of GET requests
 * to pathe.fr and add CORS headers to the response — no business logic, no storage, no auth.
 *
 * Deploy: `npm run deploy` from this directory (requires a free Cloudflare account + wrangler
 * login). Then set VITE_API_PROXY_URL in the front-end to the worker's URL.
 */

const UPSTREAM = 'https://www.pathe.fr'

const ALLOWED_PATH_PATTERNS = [
  /^\/api\/cinemas$/,
  /^\/api\/cinema\/[a-z0-9-]+$/,
  /^\/api\/cinema\/[a-z0-9-]+\/shows$/,
  /^\/api\/shows$/,
  /^\/api\/show\/[a-z0-9-]+\/showtimes\/[a-z0-9-]+\/\d{4}-\d{2}-\d{2}$/,
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
    }

    if (!ALLOWED_PATH_PATTERNS.some((re) => re.test(url.pathname))) {
      return new Response('Not found', { status: 404, headers: CORS_HEADERS })
    }

    // pathe.fr's WAF has been observed blocking this worker outright (403, "Error from IP
    // ...") regardless of these headers — it may be denylisting Cloudflare Workers' egress
    // ranges rather than sniffing the User-Agent. If requests still 403 after this change, the
    // fix is out of this worker's reach: it needs relaying from non-Cloudflare infrastructure.
    const upstreamResponse = await fetch(`${UPSTREAM}${url.pathname}${url.search}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        Accept: 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        Referer: 'https://www.pathe.fr/',
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    })

    const body = await upstreamResponse.text()
    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('Content-Type') ?? 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...CORS_HEADERS,
      },
    })
  },
}
