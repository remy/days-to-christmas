const geoTz = require('geo-tz');
// const differenceInDays = require('date-fns/difference_in_days');
const fetch = require('node-fetch');
const differenceInDays = require('date-fns/difference_in_calendar_days');
const parse = require('date-fns/parse');
const tz = require('./tz');

async function getTZ(timezone, ip) {
  timezone = (timezone || '').toLowerCase();
  let tzOffset = timezone ? tz.get(timezone) : undefined;

  if (tzOffset === undefined) {
    const res = await fetch(`https://ip2tz.isthe.link/?ip=${ip}`);
    const data = await res.json();
    const timezone = geoTz(data.latitude, data.longitude);
    tzOffset = tz.get(timezone.toLowerCase());
  }

  return tzOffset;
}

async function days(timezone, ip) {
  const tzOffset =
    timezone && typeof timezone !== 'string'
      ? timezone
      : await getTZ(timezone, ip);

  const date = new Date();
  const year = date.getFullYear();
  const xmas = parse(`${year}-12-25T00:00:00`);

  const now = new Date().getTime() + tzOffset.ms;
  let delta = differenceInDays(xmas, now);

  if (delta < 0) {
    delta = differenceInDays(parse(`${year + 1}-12-25T00:00:00`), now);
  }

  return delta;
}

module.exports = { days, getTZ };
