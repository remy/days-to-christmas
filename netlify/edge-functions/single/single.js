import getCountdown from '../../../lib/date-lib.js';

export default async function handler(request, context) {
  const url = new URL(request.url);

  let to = url.searchParams.get('to') || null;
  let name = url.searchParams.get('name') || 'not set';
  let icon = url.searchParams.get('icon') || null;
  let unit = url.searchParams.get('unit') || 'days';

  const frames = [getCountdown(to, name, icon, unit)];

  return new Response(JSON.stringify(frames), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
