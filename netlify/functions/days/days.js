import { builder } from '@netlify/functions';
import { Temporal } from '@js-temporal/polyfill';
import { differenceInDays, parseISO } from 'date-fns';

const MIN = 1000 * 60;
const HOUR = MIN * 60;

async function handler(event, context) {
  if (event.path === '/favicon.ico') {
    return {
      statusCode: 204,
      body: '',
    };
  }

  // On-Demand Builders clear queryStringParameters for caching
  // Parse from rawUrl instead
  const url = new URL(event.rawUrl || 'http://localhost/');
  const params = Object.fromEntries(url.searchParams);
  
  let tz = params.tz;
  let target = params.to || '25';
  let icon = params.icon || null;

  // are we counting down or up?
  const countDown = !target.includes('-');

  try {
    Temporal.Now.instant().toZonedDateTimeISO(tz);
  } catch (e) {
    tz = false;
  }

  if (!tz) {
    // fallback to UTC if no timezone provided
    // Note: context.geo is not available in regular functions
    tz = 'UTC';
  }

  const ua = event.headers['user-agent'] || '';
  const lametric = true; // ua.toLowerCase().includes('lametric');

  let zone;

  try {
    zone = Temporal.Now.instant().toZonedDateTimeISO(tz);
  } catch (e) {
    console.log(`invalid zone: ${tz}`);
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

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(res),
    // TTL in seconds - cache for 1 hour (3600 seconds) for date-sensitive data
    // This ensures countdown is updated hourly for accuracy
    ttl: 3600,
  };
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
  const endDate = parseISO(`${year}-${month}-${target}T00:00:00`);

  const now = new Date().getTime() + ms(tzOffset);
  let delta = differenceInDays(endDate, now);

  if (delta < 0) {
    delta = differenceInDays(
      parseISO(`${year + 1}-${month}-${target}T00:00:00`),
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

// Wrap with builder for On-Demand Builder functionality
// TTL is set to 1 hour (3600 seconds) for date-sensitive data
// This ensures cache is refreshed every hour to keep countdown accurate
export default builder(handler);

export const config = {
  path: '/',
};
