/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  webServer: {
    command: 'jlpm start',
    url: 'http://localhost:8888/lab',
    timeout: 120 * 1000,
    // Always start a fresh, test-configured server (auth disabled via
    // jupyter_server_test_config.py) so runs are isolated and never attach to
    // an unrelated server that happens to be on port 8888.
    reuseExistingServer: false
  }
};
