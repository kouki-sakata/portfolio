import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../openapi/openapi.yaml',
  output: 'src/types',
  plugins: [
    {
      name: '@hey-api/typescript',
      enums: 'typescript',
    }
  ],
});