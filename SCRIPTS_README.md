# tuta-cli

Headless browser automation CLI for Tuta Mail. 

## Features
- Headless login via Playwright
- List latest emails from inbox
- Console table output

## Installation
```bash
npm install
```

## Usage
```bash
export TUTA_EMAIL=your@email.com
export TUTA_PASSWORD=yourpassword
node index.js list
```

*Note: This is a bot-specific utility for environments where standard IMAP is unavailable.*
