# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "days-to-christmas" countdown service built as a Netlify Edge Function. It calculates the number of days until Christmas (or any specified date) with timezone support and outputs JSON responses for LaMetric devices and general API usage.

## Architecture

- **Netlify Edge Function**: Single handler at `netlify/edge-functions/days/days.js`
- **Configuration**: `netlify.toml` maps the root path `/` to the `days` function
- **Dependencies**: Uses ESM imports from CDN for date handling:
  - `@js-temporal/polyfill` for timezone calculations
  - `date-fns` for date difference calculations

## Development Commands

```bash
# Start local development server
npm run dev
# This runs: netlify dev --no-open
```

## Core Functionality

The main edge function (`netlify/edge-functions/days/days.js`) provides:

1. **Date Calculation**: Calculates days until target date (defaults to Christmas, Dec 25)
2. **Timezone Support**: Uses URL parameter `tz` or falls back to Netlify geo-detected timezone
3. **Flexible Targets**: Supports custom dates via `to` parameter (e.g., `?to=10-31` for Halloween)
4. **LaMetric Integration**: Detects LaMetric devices and returns appropriate response format
5. **Goal Data**: Returns countdown with start/current/end values for progress tracking

## API Parameters

- `tz`: Timezone string (e.g., "America/New_York")
- `to`: Target date in MM-DD format (defaults to "25" for Dec 25)
- `icon`: Custom icon ID for LaMetric display

## Key Implementation Details

- Handles invalid timezones gracefully by falling back to UTC
- Supports countdown and count-up modes based on date format
- LaMetric mode is currently forced on (line 36: `const lametric = true`)
- Uses timezone offset calculations for accurate date differences
- Automatically handles year rollover for future dates

## Dependencies

The project uses minimal dependencies:
- `netlify-cli` for local development
- External CDN imports for date utilities (no bundling required)