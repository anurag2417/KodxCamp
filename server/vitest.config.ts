import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/kodxcamp_test',
      JWT_SECRET: 'test_jwt_secret_must_be_at_least_32_characters_long_12345',
      AUTH_PEPPER: 'test_auth_pepper_must_be_at_least_32_characters_long_12345',
      SETUP_TOKEN_SECRET: 'test_setup_token_secret_must_be_at_least_32_chars_12345',
    },
  },
});
