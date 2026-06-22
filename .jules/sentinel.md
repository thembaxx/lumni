## 2026-05-15 - Added Security Headers

**Vulnerability:** Missing security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy)  
**Learning:** The Lumni codebase had no security headers configured, leaving it vulnerable to clickjacking, MIME sniffing attacks, and other client-side attacks. Initial CSP blocked iconify domains needed for icons.  
**Prevention:** Added security headers middleware in next.config.ts to provide defense-in-depth protection across all routes. Updated CSP to include required iconify API domains (api.iconify.design, api.simplesvg.com, api.unisvg.com) for proper icon loading while maintaining security.
