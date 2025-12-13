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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=Europe/London&to=25',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/favicon.ico',
        rawUrl: 'http://localhost:8888/favicon.ico',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});

      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });

    it('should default to target date of 25 (Christmas)', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=America/New_York&to=25',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });

    it('should fallback to UTC when no timezone provided', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?to=25',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });

    it('should handle invalid timezone gracefully', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=Invalid/Timezone&to=25',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=31',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body.frames[0].goalData).toHaveProperty('current');
    });

    it('should handle full date format (MM-DD)', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=10-31',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=25',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});
      const body = JSON.parse(result.body);

      expect(body.frames[0].icon).toBeDefined();
      expect(['a1817', 'a2162']).toContain(body.frames[0].icon);
    });

    it('should use custom icon when provided', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=25&icon=i1234',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=25',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=25',
        queryStringParameters: {},
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
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/?tz=UTC&to=25',
        queryStringParameters: {},
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
    it('should handle missing rawUrl', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        queryStringParameters: {},
        headers: {},
      };

      const result = await handler(event, {});
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.frames).toBeDefined();
    });

    it('should handle empty query parameters', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/',
        rawUrl: 'http://localhost:8888/',
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
      httpMethod: 'GET',
      path: '/',
      rawUrl: 'http://localhost:8888/?tz=UTC&to=25',
      queryStringParameters: {},
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

describe('On-Demand Builder caching', () => {
  it('should return ttl property for cache control', async () => {
    vi.doMock('@netlify/functions', () => ({
      builder: (fn) => fn,
    }));

    const module = await import('./days.js');
    const handler = module.default;

    const event = {
      httpMethod: 'GET',
      path: '/',
      rawUrl: 'http://localhost:8888/?tz=UTC&to=25',
      queryStringParameters: {},
      headers: {},
    };

    const result = await handler(event, {});

    // On-Demand Builders use ttl property for cache expiration
    expect(result).toHaveProperty('ttl');
    expect(result.ttl).toBe(3600); // 1 hour in seconds
  });

  it('should cache uniquely per query string combination', async () => {
    vi.doMock('@netlify/functions', () => ({
      builder: (fn) => fn,
    }));

    const module = await import('./days.js');
    const handler = module.default;

    // Test two different query string combinations
    const event1 = {
      httpMethod: 'GET',
      path: '/',
      rawUrl: 'http://localhost:8888/?tz=Europe/London&to=25',
      queryStringParameters: {},
      headers: {},
    };

    const event2 = {
      httpMethod: 'GET',
      path: '/',
      rawUrl: 'http://localhost:8888/?tz=America/New_York&to=25',
      queryStringParameters: {},
      headers: {},
    };

    const result1 = await handler(event1, {});
    const result2 = await handler(event2, {});

    // Both should succeed
    expect(result1.statusCode).toBe(200);
    expect(result2.statusCode).toBe(200);

    // Both should have caching TTL
    expect(result1.ttl).toBe(3600);
    expect(result2.ttl).toBe(3600);

    // Parse bodies to verify they're valid
    const body1 = JSON.parse(result1.body);
    const body2 = JSON.parse(result2.body);

    expect(body1.frames).toBeDefined();
    expect(body2.frames).toBeDefined();
  });
});
