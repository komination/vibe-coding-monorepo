# Commit Message Guide

This guide provides conventions for creating consistent, clear commit messages based on the project's commit history.

## Format

```
<type>(<scope>): <description>
```

## Types

- **feat**: New feature implementation
- **fix**: Bug fixes and error corrections  
- **refactor**: Code restructuring without changing external behavior
- **chore**: Maintenance tasks, dependency updates, cleanup
- **test**: Adding or updating tests

## Scopes

- **backend**: Backend-related changes (most common)
- **frontend**: Frontend-related changes
- **root**: Project-level changes (package.json, configs)

## Description Guidelines

- Use present tense ("add" not "added")
- Be specific and descriptive
- Mention key components or systems affected
- Keep under 72 characters
- **Keep messages concise**: Avoid overly long descriptions
- **No tool signatures**: Do not include "Generated with Claude Code" or similar signatures

## Examples from Project History

### Features
```
feat(backend): implement board member management
feat(backend): add JWT types and token blacklist system
feat(backend): add logout functionality
feat(backend): enhance auth with token rotation and security
```

### Fixes
```
fix(backend): update error messages and refactor user identifier to cognitoSub
```

### Refactoring
```
refactor(backend): migrate to Cognito-only authentication
refactor(backend): consolidate database migrations into single file
refactor(backend): improve error handling and cleanup
```

### Testing
```
feat(backend): add test
feat(backend): add entity tests for Card, List, and User
```

### Maintenance
```
chore: update dependencies and cleanup
```

## Best Practices

1. **Be specific**: "add user authentication" vs "add auth"
2. **Group related changes**: Combine logical units of work
3. **Use consistent terminology**: Follow established patterns
4. **Reference components**: Mention entities, services, or features
5. **Indicate impact**: Specify if it's enhancement, addition, or fix
6. **Stay concise**: Prefer shorter, focused messages over lengthy explanations
7. **Avoid signatures**: Never include tool-generated signatures or credits

## Common Patterns

- Authentication: `feat(backend): add/enhance/migrate auth system`
- CRUD operations: `feat(backend): implement [entity] management`
- Error handling: `fix/refactor(backend): improve error handling`
- Database: `refactor(backend): consolidate/migrate database [operation]`
- Testing: `feat(backend): add [component] test`