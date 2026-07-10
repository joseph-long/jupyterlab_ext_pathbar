import { expect, test } from '@jupyterlab/galata';

const PLUGIN_ID = 'jupyterlab_ext_pathbar:plugin';

test('should activate the path bar plugin', async ({ page }) => {
  // The plugin no longer logs on activation (per the coding guidelines), so
  // check activation directly against the JupyterLab application, which Galata
  // exposes on the page as `window.jupyterapp`.
  const activated = await page.evaluate(pluginId => {
    const app = (
      window as unknown as {
        jupyterapp: { isPluginActivated(id: string): boolean };
      }
    ).jupyterapp;
    return app.isPluginActivated(pluginId);
  }, PLUGIN_ID);

  expect(activated).toBe(true);
});
