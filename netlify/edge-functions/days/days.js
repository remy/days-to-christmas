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

  if (!tz) {
    // get from Netlify geo
    tz = context.geo.timezone;
  }

  const zone = Temporal.Now.instant().toZonedDateTimeISO(tz);

  const current = days(zone.offset);

  const icon = current === 0 ? 'a2162' : 'a1817';

  const startOptions = { 11: 25, 10: 55 };
  const m = new Date().getMonth();

  const start = startOptions[m] || 365;

  const unit = current === 1 ? ' day' : ' days';

  const res = {
    frames: [
      {
        goalData: {
          start,
          current,
          end: 0,
          unit,
        },
        icon,
      },
    ],
  };

  return new Response(JSON.stringify(res), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function days(tzOffset) {
  const date = new Date();
  const year = date.getFullYear();
  const xmas = parse(`${year}-12-25T00:00:00`);

  const now = new Date().getTime() + ms(tzOffset);
  let delta = differenceInDays(xmas, now);

  if (delta < 0) {
    delta = differenceInDays(parse(`${year + 1}-12-25T00:00:00`), now);
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