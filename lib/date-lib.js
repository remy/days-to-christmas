import { Temporal } from 'https://esm.sh/@js-temporal/polyfill';

/**
 *
 * @param {string} date as MM-DD
 * @param {string} name
 * @param {string} icon
 * @param {"weeks" | "days"} diff
 * @returns
 */
export default function getCountdown(date, name, icon, diff = 'weeks') {
  const unit = `${diff.substr(0, 1)} ${name}`;
  return {
    goalData: {
      start: 0,
      current: days(date, diff),
      end: diff === 'weeks' ? 52 : 365,
      unit: ` ${name}`,
    },
    icon,
  };
}

function days(to, diff = 'weeks') {
  const today = Temporal.Now.plainDateISO();
  const year = today.year;
  const targetDate = Temporal.PlainDate.from(`${year}-${to}`);

  let delta;
  if (diff === 'weeks') {
    delta = Math.floor(targetDate.until(today).total('days') / -7);
  } else {
    delta = targetDate.until(today).total('days') * -1;
  }

  if (delta < 0) {
    const nextYearTarget = targetDate.add({ years: 1 });
    if (diff === 'weeks') {
      delta = Math.floor(nextYearTarget.until(today).total('days') / -7);
    } else {
      delta = nextYearTarget.until(today).total('days') * -1;
    }
  }

  return Math.floor(delta);
}
