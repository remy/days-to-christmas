# Days to Christmas

A Netlify Function service that calculates the number of days until Christmas (or any specified date) with timezone support and LaMetric device integration.

## Overview

This service provides a countdown API that:
- Calculates days until a target date (defaults to December 25th)
- Supports custom timezones
- Formats output for LaMetric devices
- Uses Netlify On-Demand Builders for efficient CDN-level caching

## Architecture

### CDN Caching

This project uses Netlify Functions with CDN caching headers instead of Edge Functions for better caching performance:

**Benefits:**
- **Shared CDN-level cache**: Responses are cached at Netlify's CDN edge nodes
- **Cache key = path + query string**: Each unique URL combination is cached separately
- **Function not invoked on cache hit**: Subsequent requests are served from cache without executing the function
- **TTL-based expiry**: Cache expires every hour (3600 seconds) to ensure countdown accuracy

**Traditional Flow (Edge Functions):**
```
Request → Edge Function → Response (every request)
```

**Optimized Flow (CDN Caching):**
```
First Request:     Request → Function → Response → CDN Cache
Subsequent Requests: Request → CDN Cache → Response (fast!)
After TTL expires:  Request → Function → Response → CDN Cache (refresh)
```

### Cache Behavior

- **TTL**: 1 hour (3600 seconds) via `Cache-Control` headers
- **Cache Key**: Full URL path + query string
- **Headers Used**: 
  - `Cache-Control: public, max-age=3600, s-maxage=3600`
  - `Netlify-CDN-Cache-Control: public, max-age=3600, must-revalidate`
- **Example**: `/?tz=Europe/London&to=25` and `/?tz=America/New_York&to=25` are cached separately

This means:
- First request from any timezone/date combo: Cold start, function executes
- Subsequent requests within 1 hour: Served from CDN cache (ultra-fast)
- After 1 hour: Cache refreshes automatically to show updated countdown

## API Usage

### Endpoint

```
GET /
```

### Query Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `tz` | Timezone (IANA format) | `UTC` | `Europe/London`, `America/New_York` |
| `to` | Target date | `25` (Dec 25) | `25` or `10-31` (MM-DD) |
| `icon` | LaMetric icon ID | Auto (a1817 or a2162) | `i1234` |

### Examples

**Basic Christmas countdown (UTC):**
```bash
curl "https://your-domain.netlify.app/"
```

**Christmas countdown (London timezone):**
```bash
curl "https://your-domain.netlify.app/?tz=Europe%2FLondon&to=25"
```

**Halloween countdown:**
```bash
curl "https://your-domain.netlify.app/?tz=America%2FNew_York&to=10-31"
```

**Custom icon:**
```bash
curl "https://your-domain.netlify.app/?tz=UTC&to=25&icon=i5678"
```

### Response Format

**LaMetric Format (default):**
```json
{
  "frames": [
    {
      "goalData": {
        "start": 25,
        "current": 11,
        "end": 0,
        "unit": " days"
      },
      "icon": "a1817"
    }
  ]
}
```

**Fields:**
- `start`: Starting value for progress bar
- `current`: Days remaining until target date
- `end`: Ending value (0 for countdown)
- `unit`: Display unit (" day" or " days")
- `icon`: LaMetric icon identifier

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

This starts the Netlify Dev server at `http://localhost:8888`

### Testing

Run all tests:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

### Test Coverage

The test suite includes 19 comprehensive tests covering:
- Basic functionality and response format (Response API)
- Timezone handling (valid, invalid, missing)
- Custom target dates (day only, MM-DD format)
- Icon handling (default and custom)
- GoalData structure validation
- Query parameter handling
- CDN caching behavior (Cache-Control headers)
- Error handling

## Migration from Edge Functions

This project was migrated from Netlify Edge Functions to regular Netlify Functions with CDN caching for better caching performance.

### Key Changes

1. **Function Location**: 
   - Old: `netlify/edge-functions/days/days.js`
   - New: `netlify/functions/days/days.js`

2. **Dependencies**:
   - Changed from ESM CDN imports to npm packages
   - Uses `@js-temporal/polyfill` and `date-fns` as npm dependencies

3. **Configuration**:
   - Updated `netlify.toml` to use `[functions]` instead of `[[edge_functions]]`
   - Added `type: "module"` to `package.json`
   - Added `cache: 'manual'` config for CDN caching

4. **Response Format**:
   - Returns `Response` objects instead of plain objects
   - Uses standard Web API Response constructor

5. **Caching**:
   - Uses `Cache-Control` and `Netlify-CDN-Cache-Control` headers (3600 seconds TTL)
   - Query parameters parsed from `rawUrl` for proper cache key generation

6. **Context Differences**:
   - Edge Functions had access to `context.geo.timezone`
   - Regular Functions default to UTC when no timezone provided
   - Clients should explicitly pass timezone parameter

## Deployment

Deploy to Netlify:
```bash
git push
```

Netlify automatically:
1. Installs dependencies
2. Builds the function
3. Deploys to CDN edge nodes
4. Configures On-Demand Builder caching

## Performance

**Cold Start (first request):**
- Function execution time: ~50-100ms
- Total response time: ~100-200ms

**Cached Request (within TTL):**
- Response time: ~10-50ms (served from CDN)

**Cache Hit Rate (expected):**
- ~99% for popular timezone/date combinations
- Refreshes hourly for accuracy

## License

MIT - See LICENSE file for details

## Author

Remy Sharp
