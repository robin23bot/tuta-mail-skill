import { chromium } from 'playwright';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const program = new Command();

program
  .name('tuta-cli')
  .description('Headless CLI for Tuta Mail')
  .version('1.0.0');

async function login(page, email, password) {
  console.log(`Logging in as ${email}...`);
  await page.goto('https://app.tuta.com/login');
  
  await page.waitForSelector('input', { timeout: 10000 });
  await page.fill('input[type="email"], input[aria-label="Email address"], input[type="text"]', email);
  await page.fill('input[type="password"], input[aria-label="Password"]', password);
  await page.click('button:has-text("Log in")');

  await page.waitForURL('**/mail/**', { timeout: 30000 });
  console.log('Login successful.');
}

program
  .command('list')
  .description('List latest emails from inbox')
  .option('-u, --user <email>', 'Tuta email address')
  .option('-p, --pass <password>', 'Tuta password')
  .option('-l, --limit <number>', 'Number of emails to list', '5')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    const email = options.user || process.env.TUTA_EMAIL;
    const password = options.pass || process.env.TUTA_PASSWORD;

    if (!email || !password) {
      console.error('Error: Email and password are required');
      process.exit(1);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page, email, password);
      await page.waitForSelector('.virt-list-item, [role="listitem"]', { timeout: 15000 }).catch(() => {});

      const emails = await page.evaluate((limit) => {
        let items = Array.from(document.querySelectorAll('.virt-list-item, [role="listitem"]'));
        
        if (items.length === 0) {
           items = Array.from(document.querySelectorAll('div')).filter(el => {
             return el.children.length >= 2 && 
                    /^\d{2}:\d{2}$|^\d{2}\.\d{2}\.\d{2}$/.test(el.innerText) &&
                    el.innerText.length < 500;
           });
        }

        return items.slice(0, parseInt(limit)).map((item, index) => {
          const text = item.innerText || '';
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          
          const sender = item.querySelector('.sender, [class*="sender"]')?.textContent?.trim() || lines[0] || 'Unknown';
          const subject = item.querySelector('.subject, [class*="subject"]')?.textContent?.trim() || lines[2] || lines[1] || 'No Subject';
          const time = item.querySelector('.time, [class*="time"]')?.textContent?.trim() || lines[1] || 'Unknown';
          const isUnread = item.classList.contains('unread') || !!item.querySelector('.unread') || item.innerHTML.includes('font-weight: bold') || item.innerHTML.includes('font-weight:600');
          
          return { id: index, sender, subject, time, isUnread };
        });
      }, options.limit);

      if (options.json) {
        console.log(JSON.stringify(emails, null, 2));
      } else {
        console.table(emails);
      }
    } catch (err) {
      console.error('Failed:', err.message);
      await page.screenshot({ path: 'list-error.png' });
    } finally {
      await browser.close();
    }
  });

program
  .command('read <index>')
  .description('Read the body of a specific email')
  .option('-u, --user <email>', 'Tuta email address')
  .option('-p, --pass <password>', 'Tuta password')
  .action(async (index, options) => {
    const email = options.user || process.env.TUTA_EMAIL;
    const password = options.pass || process.env.TUTA_PASSWORD;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await login(page, email, password);
      await page.waitForSelector('.virt-list-item, [role="listitem"]', { timeout: 15000 }).catch(() => {});
      
      let items = await page.$$('.virt-list-item, [role="listitem"]');
      if (items.length === 0) {
          // Fallback discovery if class names changed
          items = await page.$$('div:has(> div:text-matches("^\\d{2}:\\d{2}$"))');
      }

      if (index >= items.length) {
          console.error(`Error: Index ${index} out of range (max ${items.length - 1})`);
          return;
      }

      console.log(`Opening email at index ${index}...`);
      await items[index].click();
      console.log('Clicked. Waiting for body...');
      await page.waitForTimeout(5000); 
      
      const frames = page.frames();
      let body = '';
      
      // Look for a frame that isn't the main one and contains text
      for (const frame of frames) {
          if (frame === page.mainFrame()) continue;
          const text = await frame.innerText('body').catch(() => '');
          if (text.trim().length > 0) {
              body = text;
              break;
          }
      }

      if (!body) {
          // Fallback to main page search if no frames worked
          body = await page.evaluate(() => {
              const reader = document.querySelector('region[aria-label="Email"], .mail-reader, [role="main"]:last-child');
              return reader ? reader.innerText : 'Could not find body';
          });
      }

      console.log('\n--- EMAIL BODY ---');
      console.log(body);
      console.log('------------------\n');

    } catch (err) {
      console.error('Failed:', err.message);
      await page.screenshot({ path: 'read-error.png' });
    } finally {
      await browser.close();
    }
  });

program
  .command('send')
  .description('Send a new email')
  .option('-u, --user <email>', 'Tuta email address')
  .option('-p, --pass <password>', 'Tuta password')
  .option('-t, --to <recipient>', 'Recipient email')
  .option('-s, --subject <subject>', 'Email subject')
  .option('-b, --body <body>', 'Email body')
  .action(async (options) => {
    const email = options.user || process.env.TUTA_EMAIL;
    const password = options.pass || process.env.TUTA_PASSWORD;
    const { to, subject, body } = options;

    if (!to || !subject || !body) {
      console.error('Error: --to, --subject, and --body are required');
      return;
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await login(page, email, password);
      
      console.log('Clicking New Email...');
      await page.click('button:has-text("New email"), button[title="New email"]');
      
      await page.waitForSelector('input[placeholder="To"], input[aria-label="To"]', { timeout: 10000 });
      await page.fill('input[placeholder="To"], input[aria-label="To"]', to);
      await page.press('input[placeholder="To"], input[aria-label="To"]', 'Enter');
      
      await page.fill('input[placeholder="Subject"], input[aria-label="Subject"]', subject);
      
      const bodySelector = '[role="textbox"], .editor, .ql-editor, div[contenteditable="true"]';
      await page.click(bodySelector);
      await page.fill(bodySelector, body);
      
      console.log('Sending...');
      await page.click('button:has-text("Send"), button[title="Send"]');
      
      await page.waitForSelector('text=Email sent', { timeout: 10000 }).catch(() => console.log('Wait for "Email sent" timed out, but proceeding...'));
      console.log('Email sent successfully!');

    } catch (err) {
      console.error('Failed:', err.message);
      await page.screenshot({ path: 'send-error.png' });
    } finally {
      await browser.close();
    }
  });

program
  .command('delete <indices...>')
  .description('Delete one or more emails by index')
  .option('-u, --user <email>', 'Tuta email address')
  .option('-p, --pass <password>', 'Tuta password')
  .action(async (indices, options) => {
    const email = options.user || process.env.TUTA_EMAIL;
    const password = options.pass || process.env.TUTA_PASSWORD;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await login(page, email, password);
      await page.waitForSelector('.virt-list-item, [role="listitem"]', { timeout: 15000 });
      
      const sortedIndices = indices.map(Number).sort((a, b) => b - a); 
      
      for (const index of sortedIndices) {
        const items = await page.$$('.virt-list-item, [role="listitem"]');
        if (index >= items.length) continue;
        
        console.log(`Deleting email at index ${index}...`);
        await items[index].click();
        
        const deleteBtn = await page.waitForSelector('button[title="Delete email"], button[title="Delete"], button:has-text("Delete")', { timeout: 5000 }).catch(() => null);
        if (deleteBtn) {
          await deleteBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      
      console.log('Deletion completed.');

    } catch (err) {
      console.error('Failed:', err.message);
      await page.screenshot({ path: 'delete-error.png' });
    } finally {
      await browser.close();
    }
  });

program.parse();
