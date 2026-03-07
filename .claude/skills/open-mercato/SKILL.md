# open-mercato Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the development patterns and workflows for the open-mercato project, a TypeScript-based Next.js application with comprehensive internationalization, testing, and modular architecture. The codebase follows enterprise patterns with strong emphasis on integration testing, database migrations, and multi-language support.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- Integration tests follow pattern: `TC-*-*.spec.ts`
- API routes: `route.ts` in directory structure
- Migrations: `Migration{timestamp}.ts`
- Specs: `SPEC-*.md`

### Import/Export Style
- Mixed import styles (both named and default imports)
- Prefer **default exports** for components and main modules
- Use named exports for utilities and types

### Example File Structure
```
packages/module-name/
├── src/
│   ├── modules/
│   │   ├── feature/
│   │   │   ├── api/endpoint/route.ts
│   │   │   ├── __integration__/TC-feature-001.spec.ts
│   │   │   ├── migrations/Migration20240101000000.ts
│   │   │   └── i18n/
│   │   │       ├── en.json
│   │   │       ├── de.json
│   │   │       ├── es.json
│   │   │       └── pl.json
```

## Workflows

### Version Release
**Trigger:** When ready to create a new release (~2x/month)
**Command:** `/release`

1. Update version in main `package.json`
2. Update version in `apps/mercato/package.json`
3. Update version in all `packages/*/package.json` files
4. Run `yarn install` to update `yarn.lock`
5. Update `.gitignore` if needed
6. Create release commit: `release: v{version}`

### Integration Test Suite
**Trigger:** When adding comprehensive testing for a feature or module (~8x/month)
**Command:** `/add-integration-tests`

1. Create test file following pattern: `TC-{module}-{number}.spec.ts`
2. Place in appropriate `__integration__/` directory
3. Add test helpers and fixtures if needed
4. Update integration test configuration in `packages/cli/src/lib/testing/integration.ts`
5. Mirror tests in `packages/create-app/template/` structure

**Example Test File:**
```typescript
// packages/users/src/modules/auth/__integration__/TC-auth-001.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Module', () => {
  test('TC-auth-001: User login flow', async ({ page }) => {
    // Test implementation
  });
});
```

### I18n Translation Sync
**Trigger:** When adding new UI text or features that need localization (~12x/month)
**Command:** `/sync-translations`

1. Start with English base translations in `*/i18n/en.json`
2. Add German translations in `*/i18n/de.json`
3. Add Spanish translations in `*/i18n/es.json`
4. Add Polish translations in `*/i18n/pl.json`
5. Ensure key consistency across all language files
6. Test translations in application

**Example Translation Structure:**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Log In",
    "logout": "Log Out"
  }
}
```

### API Route Creation
**Trigger:** When adding new backend API functionality (~10x/month)
**Command:** `/add-api-route`

1. Create `route.ts` file in appropriate API directory structure
2. Implement HTTP methods (GET, POST, PUT, DELETE)
3. Add guards and validation in `guards.ts` if needed
4. Create corresponding integration tests (`TC-*.spec.ts`)
5. Update API documentation or OpenAPI specs

**Example API Route:**
```typescript
// packages/users/src/modules/auth/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Implementation
  return NextResponse.json({ success: true });
}
```

### Database Migration
**Trigger:** When schema changes are needed (~6x/month)
**Command:** `/add-migration`

1. Create migration file: `Migration{timestamp}.ts`
2. Implement `up()` and `down()` methods
3. Update `.snapshot-open-mercato.json` with schema changes
4. Update corresponding `entities.ts` if needed
5. Test migration in integration tests

**Example Migration:**
```typescript
// Migration20240101000000.ts
import { Migration } from '@mikro-orm/migrations';

export class Migration20240101000000 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table `users` ...');
  }

  async down(): Promise<void> {
    this.addSql('drop table `users`;');
  }
}
```

### Spec Documentation
**Trigger:** When planning or documenting new feature development (~8x/month)
**Command:** `/add-spec`

1. Create specification file: `SPEC-{feature-name}.md` in `.ai/specs/`
2. Follow standard spec template with Overview, Requirements, Implementation
3. Update `.ai/specs/README.md` to include new spec
4. Add related analysis documents in `.ai/specs/analysis/` if needed
5. Link specs to implementation commits

### Template Sync
**Trigger:** When making changes that should be reflected in the app template (~6x/month)
**Command:** `/sync-template`

1. Identify changes in main application modules
2. Mirror changes to `packages/create-app/template/src/modules/`
3. Update template-specific configuration files
4. Sync `.env.example` and other config files
5. Update `packages/create-app/template/src/modules.ts`
6. Ensure integration tests are copied over

## Testing Patterns

### Framework
- **Playwright** for integration testing
- Test files use pattern: `*.test.ts` and `*.spec.ts`
- Integration tests in `__integration__/` directories

### Naming Convention
- Test cases follow: `TC-{module}-{number}: Description`
- Descriptive test names explaining the scenario
- Group related tests using `test.describe()`

### Test Structure
```typescript
test.describe('Module Name', () => {
  test('TC-module-001: Specific test scenario', async ({ page }) => {
    // Arrange
    // Act  
    // Assert
  });
});
```

## Commit Patterns

- **fix:** Bug fixes
- **feat:** New features  
- **docs:** Documentation updates
- Average commit message length: 51 characters
- Use clear, concise descriptions

## Commands

| Command | Purpose |
|---------|---------|
| `/release` | Create new version release with package updates |
| `/add-integration-tests` | Add new integration test suite with TC-* naming |
| `/sync-translations` | Update translations across all language files |
| `/add-api-route` | Create new API endpoint with tests and validation |
| `/add-migration` | Add database migration with snapshot updates |
| `/add-spec` | Create technical specification document |
| `/sync-template` | Keep create-app template synchronized with main app |