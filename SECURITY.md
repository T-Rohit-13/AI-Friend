# AI Friend — Security Model

## 1. Threat Model Overview

### Assets to Protect
- User credentials and session tokens
- Conversation content and personal messages
- Voice audio data (transient)
- Emotion predictions and personal metadata
- Memory entries (consent-gated)
- API keys and provider secrets

### Threat Actors
- **External attacker**: Unauthorized access, data exfiltration
- **Malicious user**: Abuse of AI features, prompt injection, cross-user access
- **Compromised dependency**: Supply-chain attacks
- **Misconfigured deployment**: Exposed secrets, open endpoints

## 2. Authentication & Authorization

| Control | Implementation |
|---------|---------------|
| Password storage | bcrypt or argon2 hashing |
| Authentication tokens | JWT with expiry (short-lived access, longer refresh) |
| Token validation | Server-side on every protected request |
| Session invalidation | Logout endpoint, token blacklist or short expiry |
| Rate limiting on auth | Max 5 failed login attempts per 15 minutes |

## 3. API Security

| Control | Implementation |
|---------|---------------|
| Input validation | Pydantic schemas on all endpoints |
| Request size limits | Max 10MB for audio uploads, 1KB for text |
| Rate limiting | Per-user request throttling |
| CORS | Restricted to approved frontend origins |
| Error responses | Generic messages, no stack traces in production |
| API versioning | `/api/v1/` prefix for all endpoints |

## 4. Data Security

| Control | Implementation |
|---------|---------------|
| Audio storage | Not stored by default |
| Conversation persistence | User-controlled |
| Memory system | Opt-in only, full CRUD |
| Data deletion | Account deletion removes all user data |
| Logs | No personal content in application logs |
| Database | Encrypted at rest in production |
| Secrets | Environment variables only, never in code |

## 5. ML-Specific Threats

| Threat | Mitigation |
|--------|------------|
| Prompt injection | Server-side prompt construction, output validation |
| Harmful LLM output | Safety filters, content validation |
| Model bias in emotion detection | Document limitations, uncertainty reporting |
| Audio-based user profiling | Don't store audio, don't infer identity |
| Memory poisoning | Validate stored memories, user-level isolation |

## 6. Infrastructure Security

| Control | Implementation |
|---------|---------------|
| HTTPS | Required in production |
| Dependency scanning | GitHub Dependabot or equivalent |
| Secret scanning | Pre-commit hooks, CI checks |
| Container security | Minimal base images, non-root user |
| Database access | Connection pooling, parameterized queries |

## 7. Consent & Privacy

- Memory requires explicit opt-in
- Users can view, edit, delete all personal data
- Data export available on request
- Account deletion is permanent and complete
- No cross-user data leakage (tested)
- No automatic model training on private conversations

## 8. Incident Response

- Structured logging for security events
- Audit trail for admin operations
- Alert on repeated auth failures
- Documented rollback procedures
