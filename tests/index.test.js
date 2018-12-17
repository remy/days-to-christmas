const test = require('tap').test;
const MockDate = require('mockdate');
const { days } = require('../days');

test('Remote IP request', t => {
  MockDate.set('12/25/2018 03:00:00'); // note: american dates

  days(null, '207.189.24.169')
    .then(d => {
      t.equal(d, 1, 'done');
      t.end();
    })
    .catch(e => t.fail(e));
});

test('SF xmas eve', async t => {
  MockDate.set('12/24/2018 07:00:00'); // note: american dates

  const d = await days('America/Los_Angeles');
  t.equal(d, 2, 'done');
  t.end();
});

test('New xmas eve', t => {
  MockDate.set('12/25/2018 03:00:00'); // note: american dates

  days('America/New_York')
    .then(d => {
      t.equal(d, 1, 'done');
      t.end();
    })
    .catch(e => t.fail(e));
});

test('days before', async t => {
  MockDate.set('11/17/2018 12:00:00'); // note: american dates

  const d = await days('Europe/London');
  t.equal(38, d, 'done');
  t.end();
});

test('day before', async t => {
  MockDate.set('12/24/2016 12:00:00'); // note: american dates

  const d = await days('Europe/London');
  t.equal(d, 1, 'done');
  t.end();
});

test('xmas day', async t => {
  MockDate.set('12/25/2016 12:00:00'); // note: american dates

  const d = await days('Europe/London');
  t.equal(0, d, 'done');
  t.end();
});

test('boxing day', async t => {
  MockDate.set('12/26/2016 12:00:00'); // note: american dates

  const d = await days('Europe/London');
  t.equal(364, d, 'done');
  t.end();
});
