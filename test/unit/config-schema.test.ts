import { describe, it, expect } from 'vitest';
import {
  GlobalConfigSchema,
  validateConfigKeyPath,
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  validateConfig,
} from '../../src/core/config-schema.js';

describe('GlobalConfigSchema', () => {
  it('should parse a valid config', () => {
    const config = { profile: 'custom', delivery: 'skills' };
    const result = GlobalConfigSchema.parse(config);
    expect(result.profile).toBe('custom');
    expect(result.delivery).toBe('skills');
  });

  it('should apply defaults for missing fields', () => {
    const result = GlobalConfigSchema.parse({});
    expect(result.profile).toBe('core');
    expect(result.delivery).toBe('both');
    expect(result.featureFlags).toEqual({});
  });

  it('should reject invalid profile values', () => {
    const config = { profile: 'invalid' };
    expect(() => GlobalConfigSchema.parse(config)).toThrow();
  });

  it('should preserve unknown fields with passthrough', () => {
    const config = { profile: 'core', unknownField: 'test', otherData: 123 };
    const result = GlobalConfigSchema.parse(config);
    expect(result).toMatchObject({ profile: 'core', unknownField: 'test', otherData: 123 });
  });
});

describe('validateConfigKeyPath', () => {
  it('should accept known top-level keys', () => {
    expect(validateConfigKeyPath('profile')).toEqual({ valid: true });
    expect(validateConfigKeyPath('delivery')).toEqual({ valid: true });
    expect(validateConfigKeyPath('workflows')).toEqual({ valid: true });
  });

  it('should accept nested featureFlags paths', () => {
    expect(validateConfigKeyPath('featureFlags')).toEqual({ valid: true });
    expect(validateConfigKeyPath('featureFlags.someFlag')).toEqual({ valid: true });
  });

  it('should reject empty or blank paths', () => {
    expect(validateConfigKeyPath('')).toEqual({ valid: false, reason: 'Key path must not be empty' });
    expect(validateConfigKeyPath('  ')).toEqual({ valid: false, reason: 'Key path must not be empty' });
  });

  it('should reject unknown top-level keys', () => {
    const result = validateConfigKeyPath('unknownKey');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown top-level key');
  });

  it('should reject nested paths for non-featureFlags keys', () => {
    const result = validateConfigKeyPath('profile.nested');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not support nested keys');
  });

  it('should reject deeply nested featureFlags', () => {
    const result = validateConfigKeyPath('featureFlags.a.b');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('do not support nested keys');
  });
});

describe('getNestedValue', () => {
  it('should get top-level values', () => {
    const obj = { profile: 'core' };
    expect(getNestedValue(obj, 'profile')).toBe('core');
  });

  it('should get nested values', () => {
    const obj = { featureFlags: { verbose: true } };
    expect(getNestedValue(obj, 'featureFlags.verbose')).toBe(true);
  });

  it('should return undefined for non-existent paths', () => {
    expect(getNestedValue({}, 'missing')).toBeUndefined();
    expect(getNestedValue({ a: {} }, 'a.b.c')).toBeUndefined();
  });

  it('should handle arrays', () => {
    const obj = { items: [1, 2, 3] };
    expect(getNestedValue(obj, 'items')).toEqual([1, 2, 3]);
  });
});

describe('setNestedValue', () => {
  it('should set top-level values', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'profile', 'custom');
    expect(obj.profile).toBe('custom');
  });

  it('should create intermediate objects when setting nested values', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'featureFlags.verbose', true);
    expect(obj.featureFlags).toEqual({ verbose: true });
  });

  it('should overwrite existing values', () => {
    const obj: Record<string, unknown> = { profile: 'core' };
    setNestedValue(obj, 'profile', 'custom');
    expect(obj.profile).toBe('custom');
  });
});

describe('deleteNestedValue', () => {
  it('should delete top-level keys', () => {
    const obj: Record<string, unknown> = { profile: 'core', extra: true };
    expect(deleteNestedValue(obj, 'profile')).toBe(true);
    expect(obj).not.toHaveProperty('profile');
    expect(obj).toHaveProperty('extra');
  });

  it('should delete nested keys', () => {
    const obj: Record<string, unknown> = { featureFlags: { verbose: true } };
    expect(deleteNestedValue(obj, 'featureFlags.verbose')).toBe(true);
    expect(obj.featureFlags).toEqual({});
  });

  it('should return false for non-existent keys', () => {
    const obj: Record<string, unknown> = {};
    expect(deleteNestedValue(obj, 'missing')).toBe(false);
  });

  it('should return false for invalid intermediate paths', () => {
    const obj: Record<string, unknown> = { profile: 'core' };
    expect(deleteNestedValue(obj, 'profile.nested')).toBe(false);
  });
});

describe('coerceValue', () => {
  it('should coerce "true" to boolean true', () => {
    expect(coerceValue('true')).toBe(true);
  });

  it('should coerce "false" to boolean false', () => {
    expect(coerceValue('false')).toBe(false);
  });

  it('should coerce numeric strings to numbers', () => {
    expect(coerceValue('42')).toBe(42);
    expect(coerceValue('3.14')).toBe(3.14);
  });

  it('should return string for non-numeric strings', () => {
    expect(coerceValue('hello')).toBe('hello');
  });

  it('should respect forceString flag', () => {
    expect(coerceValue('42', true)).toBe('42');
    expect(coerceValue('true', true)).toBe('true');
  });

  it('should coerce empty strings to empty string (not NaN)', () => {
    expect(coerceValue('')).toBe('');
  });
});

describe('validateConfig', () => {
  it('should return success for valid configs', () => {
    expect(validateConfig({ profile: 'core' })).toEqual({ success: true });
  });

  it('should return success for empty object', () => {
    expect(validateConfig({})).toEqual({ success: true });
  });

  it('should return error for invalid configs', () => {
    const result = validateConfig({ profile: 'bad' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
