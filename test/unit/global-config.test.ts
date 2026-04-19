import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  getGlobalConfigDir,
  getGlobalDataDir,
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  GLOBAL_CONFIG_DIR_NAME,
  GLOBAL_CONFIG_FILE_NAME,
} from '../../src/core/global-config.js';

describe('global-config constants', () => {
  it('should export correct directory name', () => {
    expect(GLOBAL_CONFIG_DIR_NAME).toBe('teamspec');
  });

  it('should export correct file name', () => {
    expect(GLOBAL_CONFIG_FILE_NAME).toBe('config.json');
  });
});

describe('getGlobalConfigDir', () => {
  it('should use XDG_CONFIG_HOME when set', () => {
    const original = process.env.XDG_CONFIG_HOME;
    const testPath = path.join(os.tmpdir(), 'teamspec-xdg-config-test-' + Date.now());
    process.env.XDG_CONFIG_HOME = testPath;
    try {
      const dir = getGlobalConfigDir();
      expect(dir).toBe(path.join(testPath, 'teamspec'));
    } finally {
      if (original !== undefined) {
        process.env.XDG_CONFIG_HOME = original;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
    }
  });

  it('should fall back to ~/.config on Unix', () => {
    const original = { ...process.env };
    delete process.env.XDG_CONFIG_HOME;
    const platform = os.platform();
    if (platform !== 'win32') {
      const dir = getGlobalConfigDir();
      expect(dir).toContain('.config/teamspec');
    }
  });
});

describe('getGlobalDataDir', () => {
  it('should use XDG_DATA_HOME when set', () => {
    const original = process.env.XDG_DATA_HOME;
    const testPath = path.join(os.tmpdir(), 'teamspec-xdg-data-test-' + Date.now());
    process.env.XDG_DATA_HOME = testPath;
    try {
      const dir = getGlobalDataDir();
      expect(dir).toBe(path.join(testPath, 'teamspec'));
    } finally {
      if (original !== undefined) {
        process.env.XDG_DATA_HOME = original;
      } else {
        delete process.env.XDG_DATA_HOME;
      }
    }
  });
});

describe('getGlobalConfigPath', () => {
  it('should return path ending with config.json', () => {
    const configPath = getGlobalConfigPath();
    expect(configPath).toMatch(/config\.json$/);
    expect(configPath).toContain('teamspec');
  });
});

describe('getGlobalConfig', () => {
  it('should return default config with expected properties', () => {
    const config = getGlobalConfig();
    expect(config).toHaveProperty('profile', 'core');
    expect(config).toHaveProperty('delivery', 'both');
    expect(config).toHaveProperty('featureFlags');
  });

  it('should deep merge featureFlags', () => {
    const tempDir = path.join(os.tmpdir(), 'teamspec-deep-merge-test-' + Date.now());
    fs.mkdirSync(path.join(tempDir, 'teamspec'), { recursive: true });
    const configFile = path.join(tempDir, 'teamspec', 'config.json');
    fs.writeFileSync(configFile, JSON.stringify({ featureFlags: { customFlag: true } }), 'utf-8');

    const original = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = tempDir;
    try {
      const loaded = getGlobalConfig();
      expect(loaded.featureFlags).toHaveProperty('customFlag', true);
    } finally {
      if (original !== undefined) {
        process.env.XDG_CONFIG_HOME = original;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should return defaults on JSON parse error', () => {
    const tempDir = path.join(os.tmpdir(), 'teamspec-parse-test-' + Date.now());
    fs.mkdirSync(path.join(tempDir, 'teamspec'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'teamspec', 'config.json'), '{ invalid json }', 'utf-8');

    const original = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = tempDir;
    try {
      const config = getGlobalConfig();
      expect(config).toHaveProperty('profile', 'core');
    } finally {
      if (original !== undefined) {
        process.env.XDG_CONFIG_HOME = original;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      fs.rmSync(tempDir, { recursive: true });
    }
  });
});

describe('saveGlobalConfig', () => {
  it('should create config directory if it does not exist', () => {
    const tempDir = path.join(os.tmpdir(), 'teamspec-save-test-' + Date.now());

    const original = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = tempDir;
    try {
      saveGlobalConfig({ profile: 'custom' });
      const configPath = path.join(tempDir, 'teamspec', 'config.json');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(content.profile).toBe('custom');
    } finally {
      if (original !== undefined) {
        process.env.XDG_CONFIG_HOME = original;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should write valid JSON with trailing newline', () => {
    const tempDir = path.join(os.tmpdir(), 'teamspec-write-test-' + Date.now());

    const original = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = tempDir;
    try {
      saveGlobalConfig({ delivery: 'skills' });
      const configPath = path.join(tempDir, 'teamspec', 'config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content.trim());
      expect(parsed.delivery).toBe('skills');
    } finally {
      if (original !== undefined) {
        process.env.XDG_CONFIG_HOME = original;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
      fs.rmSync(tempDir, { recursive: true });
    }
  });
});
