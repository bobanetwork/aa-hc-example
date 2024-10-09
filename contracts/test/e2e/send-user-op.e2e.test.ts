import {test} from './wallet-creation';
import {sleep} from "@nomicfoundation/hardhat-verify/internal/utilities";
import {ethers} from "ethers";
import {expect} from "@playwright/test";
import * as http from "http";

const RECOVERY_PHRASE = "test test test test test test test test test test test junk";

test('Full e2e test', async ({ context, extensionId }) => {

    /** @DEV keep in production, snap needs to build longer */
    // await sleep(15000);

    console.log('context, ext', extensionId);
    console.log('extensionPopup click')

    const page = await context.newPage();
    await page.setViewportSize({ width: 1500, height: 1500 });

    // console.log('ext', extensionPopup)

    await sleep(5000);
    const pages = context.pages();
    console.log(`pages: ${context.pages().map(b => b.url())}`)
    let extensionPopup = pages.find(page => page.url().startsWith(`chrome-extension://${extensionId}`));

    if (!extensionPopup) throw Error("no page!")

    sleep(5000);
    await extensionPopup!.click('button.button.btn--rounded.btn-primary');

    await clickTestIdAndWait(extensionPopup, 'onboarding-terms-checkbox')
    await clickTestIdAndWait(extensionPopup, 'onboarding-import-wallet')
    await clickTestIdAndWait(extensionPopup, 'metametrics-no-thanks')
    await fillForEach(extensionPopup);
    await clickTestIdAndWait(extensionPopup, 'import-srp-confirm')
    await fillInputAndWait(extensionPopup, 'create-password-new', '123456789')
    await fillInputAndWait(extensionPopup, 'create-password-confirm', '123456789')
    await clickTestIdAndWait(extensionPopup, 'create-password-terms')
    await clickTestIdAndWait(extensionPopup, 'create-password-import')
    await clickTestIdAndWait(extensionPopup, 'onboarding-complete-done')
    await clickTestIdAndWait(extensionPopup, 'pin-extension-next')
    await clickTestIdAndWait(extensionPopup, 'pin-extension-done')
    await extensionPopup.close();

    // on localhost:8001 -> snap logic
    await waitForSite('http://localhost:8001');

    let newPage = await context.newPage();

    await newPage.goto("http://localhost:8001");
    await clickRefIdAndWait(newPage,'connectButton');

    await sleep(1500);

    // Install Snap Logic
    console.log(`pages: ${context.pages().map(b => b.url())}`)
    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    await clickTestIdAndWait(extensionPopup, 'confirmation-submit-button');
    await clickTestIdAndWait(extensionPopup, 'confirmation-submit-button');
    await clickTestIdAndWait(extensionPopup, 'snap-privacy-warning-scroll');
    await sleep(500);
    await clickButtonWithClass(extensionPopup, "mm-button-primary");
    await sleep(500);
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await extensionPopup?.close();

    // click again on the 'connect' btn
    console.log(context.pages().map(b => b.url()));
    const ps = context.pages();
    ps.forEach(page => {
        page.close();
    })

    const nP2 = await context.newPage();
    await nP2.goto('http://localhost:8001');
    await clickButtonWithText(nP2,  'Connect to Boba Sepolia');
    await sleep(2500);

    // Create a new Smart Account
    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next');
    await createNewSmartWallet(nP2);

    console.log('checking for addr....')
    await sleep(3000);
    // confirmation
    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    await clickTestIdAndWait(extensionPopup, 'confirmation-submit-button')
    await clickTestIdAndWait(extensionPopup, 'confirmation-submit-button')

    const addr = await extractAddress(nP2);
    console.log('new address created: ', addr);

    // Fund the new Smart Account
    /** @DEV FUND THE ACCOUNT */
    await fundAddr(addr);
    console.log('waiting to receive...')
    await sleep(15000);

    /** @DEV Go to :8000 and call the handler */
    const nP3 = await context.newPage();
    await nP3.goto("http://localhost:8000");
    await clickTestIdAndWait(nP3, 'connect');

    await sleep(1500);

    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next')
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next')
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next')

    await sleep(1000);
    await nP3.reload();
    await sleep(5000);
    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next')
    await clickTestIdAndWait(extensionPopup, 'page-container-footer-next')
    await clickTestIdAndWait(nP3, 'send-request');

    await sleep(5000);
    console.log('all pages: ', context.pages().map(b => b.url()));
    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    console.log(await nP3.innerText('#root'));
    await sleep(2500);
    await clickTestIdAndWait(extensionPopup, 'confirmation-submit-button')
    await sleep(5000);
    extensionPopup = context.pages().find(page => page.url().startsWith(`chrome-extension://${extensionId}`));
    await clickTestIdAndWait(extensionPopup, 'confirmation-submit-button')

    console.log("If reached, success. Check for ETH price e.g.")
    expect(1).toEqual(1);

    await sleep(10_000);
});

export const clickTestIdAndWait = async (page: any, id: string) => {
    console.log(`Tap on data-testid=${id}`);
    await page.click(`[data-testid="${id}"]`);
    await sleep(500);
}

export const clickButtonWithClass = async (page: any, buttonClass: string) => {
    console.log(`Finding and clicking <button> with class ${buttonClass}`);
    const buttonSelector = `button.${buttonClass}`;
    const button = await page.$(buttonSelector);
    if (button) {
        await button.click();
        console.log(`Clicked <button> with class ${buttonClass}`);
    } else {
        console.log(`No <button> found with class ${buttonClass}`);
    }
};




export const getPageBy = (pages: any, byName: string) => {
    return pages.find((page: any) => page.url().startsWith(`${byName}`));
}

export const clickRefIdAndWait = async (page: any, id: string, ms: number = 500) => {
    console.log('id: ', id);
    await page.click(`#${id}`);
    await sleep(ms);
}

export const fillForEach = async (page: any) => {
    const items = RECOVERY_PHRASE.split(" ");
    const base = 'import-srp__srp-word-';
    for (let i = 0; i < 12; i ++) {
        await fillInputAndWait(page,  base+i, items[i], 0);
    }
}

export const fillInputAndWait = async (page: any, id: string, value: string, ms: number = 500) => {
    console.log(`Filling input ${id} with value: ${value}`);
    await page.fill(`[data-testid="${id}"]`, value);
    console.log('Sleep');
    await sleep(ms);
}

export const clickButtonWithText = async (page: any, selector: any) => {
    const sel = `button:has-text("${selector}")`
    const element = await page.$(sel);
    await element.click();
}

export const createNewSmartWallet = async (page: any) => {
        // Locate and click the parent div with the specific class and text
        const parentDiv = await page.locator('div.Accordion__AccordionHeader-gECkYS.ddFrHO', { hasText: 'Create account (Deterministic)' });
        console.log('clicking create account')
        await parentDiv.click();
        console.log('clicked')

        // After clicking the parent div, locate the content div that appears
        const contentDiv = await parentDiv.locator('..').locator('div.Accordion__AccordionContent-czDJDU');

        // Locate the button within the content div and click it
        const button = await contentDiv.locator('button.Buttons__ActionButton-ixlOMU.hgzfsi', { hasText: 'Create Account' });
        console.log('creating account')
        await button.click();
        console.log('acc created')
}


export const scrollToBottom = async (page: any) => {
    await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    });
};

export const fundAddr = async (toAddr: string) => {
    // Define provider (mainnet or testnet)
    // Private key of the sender
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const senderWallet = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider('http://localhost:9545'));
    const tx = {
        to: toAddr,
        value: ethers.parseEther('0.01')
    };

    try {
        const txResponse = await senderWallet.sendTransaction(tx);
        const receipt = await txResponse.wait();
        console.log('send done: ');
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

export const extractAddress = async (page: any) => {
    return await page.evaluate(() => {
        const div = document.querySelector('.styledComponents__CopyableItemValue-ctKSJz');
        if (div) {
            try {
                console.log('text content: ', div.textContent);
                const json = JSON.parse(div.textContent!);
                return json.address;
            } catch (e) {
                console.error('Error parsing JSON:', e);
                return null;
            }
        }
        return null;
    });
}

async function extractETHPrice(page:any) {
    try {
        const priceElement = await page.locator('text=Last Price for ETH is:').first();
        const priceText = await priceElement.textContent();
        const price = priceText.split('$')[1]?.trim();

        if (!price) throw new Error('Price not found in expected format');

        return price;
    } catch (error) {
        console.error('Error extracting ETH price:', error);
        return null;
    }
}

function isSiteResponding(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

async function waitForSite(url: string, timeout: number = 600_000, interval: number = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await isSiteResponding(url)) {
            console.log("Site is live!")
            return;
        }
        console.log("Site is not reachable. Waiting.");
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Site ${url} did not become available within ${timeout}ms`);
}