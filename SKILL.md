---
name: tuta-mail
description: Headless browser automation for Tuta Mail. Use when you need to list inbox messages, read email bodies, or handle verification codes from a Tuta Mail account. Supports environments where standard IMAP/SMTP is unavailable.
---

# Tuta Mail

This skill provides headless automation for Tuta Mail using Playwright.

## Prerequisites

- Playwright and Chromium must be installed in the environment.
- Credentials must be provided via environment variables or direct arguments.

## Commands

The skill uses a bundled script located at `scripts/index.js`.

### List Inbox

List the latest emails from the inbox.

```bash
export TUTA_EMAIL="your@email.com"
export TUTA_PASSWORD="yourpassword"
node skills/tuta-mail/scripts/index.js list --limit 5
```

### Read Email

Fetch the body of a specific email.

```bash
node skills/tuta-mail/scripts/index.js read <index>
```

### Send Email

```bash
node skills/tuta-mail/scripts/index.js send --to "recipient@example.com" --subject "Hello" --body "Message body here"
```

## Note on Automation

Tuta's DOM is complex and may change. If selectors fail, consult the underlying script for updates.
