import getCountdown from '../../../lib/date-lib.js';

export default async function handler(request, context) {
  const frames = [
    getCountdown('09-13', 'D', 'i6457'),
    getCountdown('11-18', 'M', 'i6458'),
    getCountdown('09-25', 'E', 'i6461'),
    getCountdown('04-17', 'S', 'i6460'),
  ].sort((a, b) => (a.goalData.current < b.goalData.current ? -1 : 1));

  return new Response(JSON.stringify(frames), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
