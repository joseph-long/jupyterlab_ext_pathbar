import { expect, IJupyterLabPageFixture, test } from '@jupyterlab/galata';

/**
 * Integration tests for the path bar widget extension.
 *
 * These mirror the manual checks used while debugging: open a document of each
 * supported type and assert a single path bar is inserted above the content,
 * shows the document's path, and has a real (non-collapsed) height.
 *
 * Fixtures are created inside the per-test `tmpPath` directory (which Galata
 * cleans up automatically) and opened with the `docmanager:open` command, so
 * the tests don't depend on file-browser navigation reflecting server-side
 * uploads.
 */

const BAR = '.jp-jupyterlab-ext-pathbar-bar';

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

test.describe('path bar', () => {
  /**
   * Open a server document by its path using the `docmanager:open` command.
   */
  async function openDocument(
    page: IJupyterLabPageFixture,
    docPath: string
  ): Promise<void> {
    await page.evaluate(async path => {
      const app = (
        window as unknown as {
          jupyterapp: {
            commands: {
              execute(
                id: string,
                args: Record<string, unknown>
              ): Promise<unknown>;
            };
          };
        }
      ).jupyterapp;
      await app.commands.execute('docmanager:open', { path });
    }, docPath);
  }

  /**
   * Assert the path bar of the document panel named `docName` is visible, above
   * the content, shows `docPath`, and is tall enough to display its text.
   */
  async function expectPathBarAbove(
    page: IJupyterLabPageFixture,
    docName: string,
    docPath: string,
    contentSelector: string
  ): Promise<void> {
    const panel = await page.activity.getPanelLocator(docName);
    expect(panel).not.toBeNull();

    // Wait for the document content to render before measuring.
    const content = panel!.locator(contentSelector);
    await expect(content).toBeVisible();

    const bar = panel!.locator(BAR);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveText(docPath);

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

  test('shows the path above a text document', async ({ page, tmpPath }) => {
    const docName = 'pathbar_hello.txt';
    const docPath = `${tmpPath}/${docName}`;
    await page.contents.uploadContent(
      'Hello from the path bar demo.\n',
      'text',
      docPath
    );
    await openDocument(page, docPath);
    await expectPathBarAbove(page, docName, docPath, '.jp-FileEditor');
  });

  test('shows the path above a notebook', async ({ page, tmpPath }) => {
    const docName = 'pathbar_demo.ipynb';
    const docPath = `${tmpPath}/${docName}`;
    await page.contents.uploadContent(NOTEBOOK_CONTENT, 'text', docPath);
    await openDocument(page, docPath);
    await expectPathBarAbove(page, docName, docPath, '.jp-Notebook');
  });

  test('shows the path above an image', async ({ page, tmpPath }) => {
    const docName = 'pathbar_pixel.png';
    const docPath = `${tmpPath}/${docName}`;
    await page.contents.uploadContent(PIXEL_PNG_BASE64, 'base64', docPath);
    await openDocument(page, docPath);
    await expectPathBarAbove(page, docName, docPath, '.jp-ImageViewer');
  });
});
