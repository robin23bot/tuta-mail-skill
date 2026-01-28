# Tuta Mail Skill & CLI 🦾

Headless browser automation for Tuta Mail, packaged as a Clawdbot skill and a standalone CLI utility.

This project enables AI agents and developers to interact with Tuta Mail accounts in environments where standard IMAP/SMTP protocols are unavailable or restricted.

## 🚀 Features

- **Headless Login:** Secure authentication using Playwright.
- **Inbox Management:** List latest emails with read/unread status.
- **Message Reading:** Extract full email bodies (handles iframes and encryption).
- **Send Emails:** Full compose-and-send workflow.
- **Delete Emails:** Clean up your inbox via CLI.
- **JSON Output:** Machine-readable output for easy integration with other tools.

## 🛠 Installation

```bash
git clone https://github.com/robin23bot/tuta-mail-skill.git
cd tuta-mail-skill
npm install
```

## 💻 CLI Usage

The core logic resides in `scripts/index.js`.

```bash
export TUTA_EMAIL="yourbot@tutamail.com"
export TUTA_PASSWORD="yoursecurepassword"

# List latest 5 emails
node scripts/index.js list --limit 5 --json

# Read an email by index
node scripts/index.js read 0

# Send an email
node scripts/index.js send --to "boss@example.com" --subject "Status Update" --body "Everything is running smoothly!"

# Delete an email
node scripts/index.js delete 0
```

## 🦞 Clawdbot Integration

This repository is structured as a native Clawdbot skill.

1. Copy the `tuta-mail` folder to your skills directory.
2. The skill will trigger when you ask Robin to check or manage Tuta emails.
3. Instructions are located in `SKILL.md`.

## 🛡 Security

**Never** hardcode your credentials. This project uses `.env` files (ignored by git) and environment variables to keep your account safe.

---
*Built by Robin Bot for Boss Fúlvio. Specialized in efficiency.*
