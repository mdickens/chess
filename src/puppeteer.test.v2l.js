const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function processHtmlAndLogErrors(htmlFilePath, logFilePath) {
    let browser;
    try {
        browser = await puppeteer.launch();
        const page = await browser.newPage();

        const logStream = fs.createWriteStream(logFilePath, { flags: 'w' });

        // Capture console messages, including errors
        page.on('console', async (msg) => {
            const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
            console.log('Browser console:', ...args);
            const text = args.join(' ');
            logStream.write(text + '\n');
        });

        // Capture page errors (runtime errors)
        page.on('pageerror', (error) => {
            const pageErrorMessage = `Page error: ${error.message}\nStack: ${error.stack}\n`;
            console.error(pageErrorMessage);
            logStream.write(pageErrorMessage);
        });

        // Capture uncaught exceptions
        page.on('error', (err) => {
            console.error('Page error:', err);
            logStream.write(`Page error: ${err.toString()}\n`);
        });

        // Capture uncaught exceptions in the page context
        await page.evaluate(() => {
            window.onerror = (message, source, lineno, colno, error) => {
                const errorMessage = `Uncaught Error: ${message} (File: ${source}, Line: ${lineno}, Column: ${colno})`;
                console.error(errorMessage);
                window.logErrorToNode(errorMessage); // Send error to Node.js
            };
        });

        await page.exposeFunction('logErrorToNode', (errorMessage) => {
            logStream.write(`${errorMessage}\n`);
        });

        await page.exposeFunction('onQUnitLog', (result) => {
            if (!result.result) {
                let logMessage = `QUnit FAIL: ${JSON.stringify(result)}
`;
                console.log(logMessage);
                logStream.write(logMessage);
            }
        });

        await page.exposeFunction('onQUnitDone', (details) => {
            const summary = `\nTests finished. Passed: ${details.passed}, Failed: ${details.failed}, Total: ${details.total}, Runtime: ${details.runtime}ms\n`;
            console.log(summary);
            logStream.write(summary);
        });

        const fileUrl = `file://${path.resolve(htmlFilePath)}`;
        console.log(`Navigating to: ${fileUrl}`);

        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForSelector('#start-game-button', { visible: true });
        await page.click('#start-game-button');
        await page.waitForSelector('#main-layout', { visible: true });

        await page.evaluate(() => {
            QUnit.log(result => {
                window.onQUnitLog(result);
            });
            QUnit.done(details => {
                window.onQUnitDone(details);
            });
        });

        await new Promise(resolve => setTimeout(resolve, 10000));

        const bestMove = await page.evaluate(() => window.bestMove);
        console.log('Best move from browser:', bestMove);

    } catch (error) {
        console.error(`An error occurred during Puppeteer operation: ${error.message}`);
        fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] Puppeteer Operation Error: ${error.message}\n`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const htmlFileName = 'tests/tests.html';
const logFileName = 'console.log';

processHtmlAndLogErrors(htmlFileName, logFileName);

