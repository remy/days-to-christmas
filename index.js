const koa = require('koa');
const moment = require('moment');
const cors = require('koa-cors');
const app = koa();

app.use(cors());

app.use(function *() {
  this.set('content-type', 'application/json');
  const res = days();
  const icon = res === 0 ? 'a2162' : 'a1817';

  this.body = {
    frames: [{
      goalData: {
        start: 365,
        current: res,
        end: 0,
        unit: ' days'
      },
      icon
    }]
  };
});

if (module.parent) {
  module.exports = days;
} else {
  app.listen(process.env.PORT || 3000);
}


function days() {
  const date = new Date();
  const year = date.getYear() + 1900;
  let xmas = moment([year, 11, 25]);
  const today = moment([year, date.getMonth(), date.getDate()]);
  const delta = xmas.diff(today, 'days');
  if (delta < 0) {
    return moment([year+1, 11, 25]).diff(today, 'days');
  }

  return delta;
}
