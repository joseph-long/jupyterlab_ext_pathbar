import { expect, IJupyterLabPageFixture, test } from '@jupyterlab/galata';

/**
 * Integration tests for the path bar widget extension.
 *
 * These mirror the manual checks used while debugging: open a document of each
 * supported type and assert a single path bar is inserted above the content,
 * shows the document's path, and has a real (non-collapsed) height.
 */

const BAR = '.jp-jupyterlab-ext-pathbar-bar';

const TEXT_PATH = 'pathbar_hello.txt';
const NOTEBOOK_PATH = 'pathbar_demo.ipynb';
const IMAGE_PATH = 'pathbar_pixel.png';

const NOTEBOOK_CONTENT = JSON.stringify({
  cells: [
    {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: ["print('hi from notebook')"]
    }
  ],
  metadata: {},
  nbformat: 4,
  nbformat_minor: 5
});

// A 1x1 transparent PNG.
const PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk' +
  '+M8AAAMBAQDJ/pdaAAAAAElFTkSuQmCC';

const FIXTURES = [TEXT_PATH, NOTEBOOK_PATH, IMAGE_PATH];

test.describe('path bar', () => {
  test.afterEach(async ({ page }) => {
    for (const filePath of FIXTURES) {
      if (await page.contents.fileExists(filePath)) {
        await page.contents.deleteFile(filePath);
      }
    }
  });

  /**
   * Assert the path bar of the current document panel is visible, above the
   * content, shows `docPath`, and is tall enough to display its text.
   */
  async function expectPathBarAbove(
    page: IJupyterLabPageFixture,
    docPath: string,
    contentSelector: string
  ): Promise<void> {
    const panel = await page.activity.getPanelLocator();
    expect(panel).not.toBeNull();

    const bar = panel!.locator(BAR);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveText(docPath);

    const content = panel!.locator(contentSelector);
    await expect(content).toBeVisible();

    const barBox = await bar.boundingBox();
    const contentBox = await content.boundingBox();
    expect(barBox).not.toBeNull();
    expect(contentBox).not.toBeNull();

    // The bar must have a real height; a regression once collapsed it to a few
    // pixels because a Lumino BoxPanel ignores CSS flex sizing.
    expect(barBox!.height).toBeGreaterThan(12);
    // The bar sits directly above the content.
    expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(contentBox!.y + 1);
  }

  test('shows the path above a text document', async ({ page }) => {
    await page.contents.uploadContent(
      'Hello from the path bar demo.\n',
      'text',
      TEXT_PATH
    );
    await page.filebrowser.open(TEXT_PATH);
    await expectPathBarAbove(page, TEXT_PATH, '.jp-FileEditor');
  });

  test('shows the path above a notebook', async ({ page }) => {
    await page.contents.uploadContent(NOTEBOOK_CONTENT, 'text', NOTEBOOK_PATH);
    await page.filebrowser.open(NOTEBOOK_PATH);
    await expectPathBarAbove(page, NOTEBOOK_PATH, '.jp-Notebook');
  });

  test('shows the path above an image', async ({ page }) => {
    await page.contents.uploadContent(
      PIXEL_PNG_BASE64,
      'base64',
      IMAGE_PATH
    );
    await page.filebrowser.open(IMAGE_PATH);
    await expectPathBarAbove(page, IMAGE_PATH, '.jp-ImageViewer');
  });
});
