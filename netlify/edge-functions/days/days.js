import { Temporal } from 'https://esm.sh/@js-temporal/polyfill';
import differenceInDays from 'https://esm.sh/date-fns@2.30.0/differenceInDays';
import parse from 'https://esm.sh/date-fns@2.30.0/parseISO';

const MIN = 1000 * 60;
const HOUR = MIN * 60;

export default async function handler(request, context) {
  if (request.url === '/favicon.ico') {
    return new Response(null, {
      status: 204,
    });
  }

  const url = new URL(request.url);

  let tz = url.searchParams.get('tz');
  let target = url.searchParams.get('to') || '25';
  let icon = url.searchParams.get('icon') || null;

  // are we counting down or up?
  const countDown = !target.includes('-');

  try {
    Temporal.Now.instant().toZonedDateTimeISO(tz);
  } catch (e) {
    tz = false;
  }

  if (!tz) {
    // get from Netlify geo
    tz = context.geo.timezone;
  }

  const ua = request.headers.get('User-Agent') || '';
  const lametric = true; // ua.toLowerCase().includes('lametric');

  let zone;

  try {
    zone = Temporal.Now.instant().toZonedDateTimeISO(tz);
  } catch (e) {
    console.log(`invalid zone: ${tz}, detected: ${context.geo.timezone}`);
    zone = {
      offset: '+0:00',
    };
  }

  const current = days(zone.offset, target);

  if (!icon) {
    icon = current === 0 ? 'a2162' : 'a1817';
  }

  const startOptions = { 11: 25, 10: 55 };
  const m = new Date().getMonth();

  const start = countDown ? startOptions[m] || 365 : 0;
  const unit = current === 1 ? ' day' : ' days';
  const end = countDown ? 0 : start;

  const res = lametric
    ? {
        frames: [
          {
            goalData: {
              start,
              current,
              end,
              unit,
            },
            icon,
          },
        ],
      }
    : {
        days: current,
      };

  return new Response(JSON.stringify(res), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function days(tzOffset, target = '25') {
  let month = '12';

  if (target.includes('-')) {
    [month, target] = target.split('-');
  }

  console.log(`target: ${target}, month: ${month}, tzOffset: ${tzOffset}`);

  target = target.padStart(2, '0');
  const date = new Date();
  const year = date.getFullYear();
  const endDate = parse(`${year}-${month}-${target}T00:00:00`);

  const now = new Date().getTime() + ms(tzOffset);
  let delta = differenceInDays(endDate, now);

  if (delta < 0) {
    delta = differenceInDays(
      parse(`${year + 1}-${month}-${target}T00:00:00`),
      now
    );
  }

  return delta;
}

function ms(tz) {
  let [, dir, hour, min] = tz.match(/([+-])(\d{2}):(\d{2})/);
  hour = parseInt(hour, 10);
  min = parseInt(min, 10);
  dir = parseInt(`${dir}1`, 10);

  return (HOUR * hour + MIN * min) * dir;
}
