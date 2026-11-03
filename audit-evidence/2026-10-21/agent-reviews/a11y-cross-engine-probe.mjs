import { chromium, firefox, webkit } from '/Users/mzebley/Documents/GitHub/a11y-charts/packages/line-chart/node_modules/playwright/index.mjs';

const engines = { chromium, firefox, webkit };
const evidence = [];
for (const [engine, playwright] of Object.entries(engines)) {
  const browser = await playwright.launch({ channel: engine === 'chromium' ? 'chrome' : undefined, headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5189/packages/line-chart/browser-tests/fixture.html');
  await page.waitForFunction(() => customElements.get('a11y-line-chart') && customElements.get('a11y-bar-chart'));
  await page.evaluate(() => {
    const line = document.createElement('a11y-line-chart');
    line.config = { tableVisibility: 'screen-reader', valuePreset: 'percent', wrapAround: false };
    line.chartTitle = 'Navigator probe';
    line.data = [
      { x: '2023', actual: 42, target: 50 },
      { x: '2024', actual: 58, target: 50 },
      { x: '2025', actual: 69, target: 60 }
    ];
    document.querySelector('#fixture').append(line);
    const bar = document.createElement('a11y-bar-chart');
    bar.config = { showDetails: true };
    bar.chartTitle = 'Bar probe';
    bar.data = [
      { id: 'first', label: 'First category', value: 4, target: 3, definition: 'First definition.' },
      { id: 'second', label: 'Second category', value: 2, target: 3, definition: 'Second definition.' }
    ];
    document.querySelector('#fixture').append(bar);
    const native = document.createElement('input');
    native.type = 'range'; native.min = '0'; native.max = '2'; native.value = '2';
    native.setAttribute('aria-label', 'Native range');
    native.setAttribute('aria-valuetext', 'Narrative on input range');
    native.id = 'native-range';
    const aria = document.createElement('div');
    aria.id = 'aria-slider'; aria.setAttribute('role', 'slider'); aria.setAttribute('tabindex', '0');
    aria.setAttribute('aria-label', 'ARIA slider'); aria.setAttribute('aria-valuemin', '0');
    aria.setAttribute('aria-valuemax', '2'); aria.setAttribute('aria-valuenow', '2');
    aria.setAttribute('aria-valuetext', 'Narrative on ARIA slider');
    document.querySelector('main').append(native, aria);
  });
  const range = page.locator('.a11y-line-chart__navigator');
  await range.focus(); await range.press('End');
  const line = await range.evaluate(element => ({
    value: element.value,
    ariaValueText: element.getAttribute('aria-valuetext'),
    ariaLabel: element.getAttribute('aria-label'),
    describedBy: element.getAttribute('aria-describedby'),
    describedText: (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
      .map(id => document.getElementById(id)?.textContent?.trim()),
    liveText: [...document.querySelectorAll('[aria-live="polite"]')].map(region => region.textContent?.trim()).filter(Boolean)
  }));
  const lineSnapshot = await range.ariaSnapshot();
  const directRangeSnapshot = await page.locator('#native-range').ariaSnapshot();
  const directAriaSliderSnapshot = await page.locator('#aria-slider').ariaSnapshot();
  const lineTableSnapshot = (await page.locator('.a11y-line-chart__table').first().ariaSnapshot()).slice(0, 800);
  const barButton = page.locator('.a11y-bar-chart__details-trigger').first();
  await barButton.focus();
  const bar = await barButton.evaluate(element => ({
    labelledBy: element.getAttribute('aria-labelledby'),
    labelledText: (element.getAttribute('aria-labelledby') || '').split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim()),
    description: document.getElementById(element.getAttribute('aria-describedby'))?.textContent?.trim(),
    ariaValueText: element.getAttribute('aria-valuetext')
  }));
  const barSnapshot = await barButton.ariaSnapshot();
  const probe = { engine, line, lineSnapshot, directRangeSnapshot, directAriaSliderSnapshot, lineTableSnapshot, bar, barSnapshot, errors };
  if (engine === 'chromium') {
    const session = await page.context().newCDPSession(page);
    await session.send('Accessibility.enable');
    const readTreeNode = async selector => {
      const { result } = await session.send('Runtime.evaluate', {
        expression: `document.querySelector(${JSON.stringify(selector)})`, objectGroup: 'a11y-probe'
      });
      const { nodes } = await session.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
      const node = nodes[0];
      return {
        role: node.role?.value,
        name: node.name?.value,
        value: node.value?.value,
        valueText: node.properties?.find(property => property.name === 'valuetext')?.value?.value,
        description: node.description?.value,
        descriptionFor: node.properties?.find(property => property.name === 'describedby')?.value?.value
      };
    };
    probe.chromeAx = {
      componentRange: await readTreeNode('.a11y-line-chart__navigator'),
      directNativeRange: await readTreeNode('#native-range'),
      directAriaSlider: await readTreeNode('#aria-slider')
    };
    await session.detach();
  }
  evidence.push(probe);
  await browser.close();
}
console.log(JSON.stringify(evidence, null, 2));
