const test = require('tap').test;
const MockDate = require('mockdate');
const days = require('../');

test('days before', t => {
  MockDate.set('11/19/2016 12:00:00'); // note: american dates

  const d = days();
  t.equal(36, d, 'done');
  t.end();
});

test('day before', t => {
  MockDate.set('12/24/2016 12:00:00'); // note: american dates

  const d = days();
  t.equal(1, d, 'done');
  t.end();
});

test('xmas day', t => {
  MockDate.set('12/25/2016 12:00:00'); // note: american dates

  const d = days();
  t.equal(0, d, 'done');
  t.end();
});

test('boxing day', t => {
  MockDate.set('12/26/2016 12:00:00'); // note: american dates

  const d = days();
  t.equal(364, d, 'done');
  t.end();
});
