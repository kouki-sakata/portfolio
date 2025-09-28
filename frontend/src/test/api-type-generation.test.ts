import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('OpenAPI Type Generation', () => {
  const apiTypesPath = join(__dirname, '../types/types.gen.ts');
  const apiSchemasPath = join(__dirname, '../schemas/api.ts');

  describe('Type Generation Scripts', () => {
    it('should have npm script for generating TypeScript types', () => {
      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf-8')
      );
      expect(packageJson.scripts).toHaveProperty('generate:api-types');
    });

    it('should have npm script for generating Zod schemas', () => {
      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf-8')
      );
      expect(packageJson.scripts).toHaveProperty('generate:zod-schemas');
    });
  });

  describe('Generated Files', () => {
    beforeAll(() => {
      // Run generation scripts
      try {
        execSync('npm run generate:api', { cwd: join(__dirname, '../..') });
      } catch (error) {
        // Allow test to fail in RED phase
      }
    });

    it('should generate TypeScript types file', () => {
      expect(existsSync(apiTypesPath)).toBe(true);
    });

    it('should generate Zod schemas file', () => {
      expect(existsSync(apiSchemasPath)).toBe(true);
    });

    it('should export authentication types', () => {
      if (existsSync(apiTypesPath)) {
        const content = readFileSync(apiTypesPath, 'utf-8');
        expect(content).toContain('LoginRequest');
        expect(content).toContain('LoginResponse');
        expect(content).toContain('SessionResponse');
      } else {
        expect.fail('API types file not generated');
      }
    });

    it('should export employee types', () => {
      if (existsSync(apiTypesPath)) {
        const content = readFileSync(apiTypesPath, 'utf-8');
        expect(content).toContain('Employee');
        expect(content).toContain('EmployeeUpsertRequest');
        expect(content).toContain('EmployeeDeleteRequest');
      } else {
        expect.fail('API types file not generated');
      }
    });

    it('should export Zod schemas with runtime validation', () => {
      if (existsSync(apiSchemasPath)) {
        const content = readFileSync(apiSchemasPath, 'utf-8');
        expect(content).toContain('z.object');
        expect(content).toContain('LoginRequest');
        expect(content).toContain('EmployeeSummaryResponse');
      } else {
        expect.fail('Zod schemas file not generated');
      }
    });

    it('should not use any or unknown types', () => {
      if (existsSync(apiTypesPath)) {
        const content = readFileSync(apiTypesPath, 'utf-8');
        expect(content).not.toMatch(/:\s*any\b/);
        // Allow unknown in index signatures like [key: string]: unknown
        // Check for standalone unknown types, but allow index signatures
        const lines = content.split('\n');
        const problematicLines = lines.filter(line => {
          // Check if the line contains ': unknown' but is not an index signature
          if (line.includes(': unknown')) {
            // Allow if it's part of an index signature pattern
            return !line.includes('[key: string]: unknown');
          }
          return false;
        });
        expect(problematicLines).toHaveLength(0);
      }
    });
  });

  describe('Type Safety', () => {
    it('should generate strict TypeScript types', () => {
      if (existsSync(apiTypesPath)) {
        const content = readFileSync(apiTypesPath, 'utf-8');
        // Check for proper type definitions
        expect(content).toMatch(/export\s+(type|interface)/);
        // Check for proper optional properties
        expect(content).toMatch(/\?:/);
      } else {
        expect.fail('API types file not generated');
      }
    });

    it('should generate Zod schemas with proper validation', () => {
      if (existsSync(apiSchemasPath)) {
        const content = readFileSync(apiSchemasPath, 'utf-8');
        // Check for Zod validation methods
        expect(content).toMatch(/z\.(string|number|boolean|object|array)/);
        // Check for optional fields
        expect(content).toMatch(/\.optional\(\)/);
        // Check for required fields
        expect(content).toMatch(/z\.object\({/);
      } else {
        expect.fail('Zod schemas file not generated');
      }
    });
  });
});