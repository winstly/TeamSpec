export class TeamSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamSpecError';
  }
}

export class InitError extends TeamSpecError {
  constructor(message: string) {
    super(message);
    this.name = 'InitError';
  }
}

export class ConfigError extends TeamSpecError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
