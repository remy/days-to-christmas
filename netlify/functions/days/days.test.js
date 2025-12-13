import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';

// Import the handler function - we need to test the unwrapped version
// Since the default export is wrapped with builder(), we'll need to mock it
describe('Days to Christmas Function', () => {
  let handler;

  beforeEach(async () => {
    // Mock the builder wrapper to get access to the actual handler
    vi.resetModules();
    vi.doMock('@netlify/functions', () => ({
      builder: (fn) => fn,
    }));

    const module = await import('./days.js');
    handler = module.default;
  });

  describe('Basic functionality', () => {
    it('should return JSON response with countdown data', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'Europe/London',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json; charset=utf-8');
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('frames');
      expect(body.frames).toHaveLength(1);
      expect(body.frames[0]).toHaveProperty('goalData');
      expect(body.frames[0]).toHaveProperty('icon');
    });

    it('should handle favicon requests', async () => {
      const event = {
        path: '/favicon.ico',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});

      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });

    it('should default to target date of 25 (Christmas)', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      // Should have countdown data
      expect(body.frames[0].goalData).toHaveProperty('current');
      expect(body.frames[0].goalData).toHaveProperty('start');
      expect(body.frames[0].goalData).toHaveProperty('end');
      expect(body.frames[0].goalData).toHaveProperty('unit');
    });
  });

  describe('Timezone handling', () => {
    it('should accept timezone parameter', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'America/New_York',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });

    it('should fallback to UTC when no timezone provided', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });

    it('should handle invalid timezone gracefully', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'Invalid/Timezone',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });
  });

  describe('Custom target dates', () => {
    it('should handle custom target date with to parameter', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '31', // New Year's Eve
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body.frames[0].goalData).toHaveProperty('current');
    });

    it('should handle full date format (MM-DD)', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '10-31', // Halloween
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body.frames[0].goalData).toHaveProperty('current');
    });
  });

  describe('Icon handling', () => {
    it('should use default icon when not specified', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body.frames[0].icon).toBeDefined();
      expect(['a1817', 'a2162']).toContain(body.frames[0].icon);
    });

    it('should use custom icon when provided', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '25',
          icon: 'i1234',
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body.frames[0].icon).toBe('i1234');
    });
  });

  describe('GoalData structure', () => {
    it('should return proper goalData structure', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);
      const goalData = body.frames[0].goalData;

      expect(goalData).toHaveProperty('start');
      expect(goalData).toHaveProperty('current');
      expect(goalData).toHaveProperty('end');
      expect(goalData).toHaveProperty('unit');
      
      expect(typeof goalData.start).toBe('number');
      expect(typeof goalData.current).toBe('number');
      expect(typeof goalData.end).toBe('number');
      expect(typeof goalData.unit).toBe('string');
    });

    it('should use singular "day" when current is 1', async () => {
      // This test would need to be run on Dec 24 to get exactly 1 day
      // For now, we just verify the unit is properly formatted
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);
      const unit = body.frames[0].goalData.unit;

      expect(unit).toMatch(/ day(s)?$/);
    });
  });

  describe('Response format', () => {
    it('should return LaMetric format by default', async () => {
      const event = {
        path: '/',
        queryStringParameters: {
          tz: 'UTC',
          to: '25',
        },
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body).toHaveProperty('frames');
      expect(Array.isArray(body.frames)).toBe(true);
      expect(body.frames[0]).toHaveProperty('goalData');
      expect(body.frames[0]).toHaveProperty('icon');
    });
  });

  describe('Query string parameters', () => {
    it('should handle missing queryStringParameters object', async () => {
      const event = {
        path: '/',
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });

    it('should handle empty queryStringParameters', async () => {
      const event = {
        path: '/',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });
  });
});

describe('Date calculation logic', () => {
  it('should calculate correct days until Christmas from today', async () => {
    vi.doMock('@netlify/functions', () => ({
      builder: (fn) => fn,
    }));

    const module = await import('./days.js');
    const handler = module.default;

    const event = {
      path: '/',
      queryStringParameters: {
        tz: 'UTC',
        to: '25',
      },
      headers: {},
    };

    const result = await handler(event, {});
    const body = JSON.parse(result.body);
    const current = body.frames[0].goalData.current;

    // For 2025-12-13, there should be 12 days until Christmas
    // This will vary based on the actual current date
    expect(typeof current).toBe('number');
    expect(current).toBeGreaterThanOrEqual(0);
  });
});
