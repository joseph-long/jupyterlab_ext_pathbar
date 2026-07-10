/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const { execFileSync } = require('child_process');
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

// Pin to IPv4 so the server bind address and the URL Galata connects to agree
// (``localhost`` can otherwise resolve to IPv6 ``::1`` while Jupyter binds
// 127.0.0.1).
const HOST = '127.0.0.1';

/**
 * Ask the OS for a free TCP port. Ephemeral ports never collide with Jupyter's
 * default (8888); the loop is a belt-and-suspenders guard on that promise.
 */
function findFreePort() {
  const script =
    "const s=require('net').createServer();" +
    `s.listen(0,'${HOST}',()=>{const p=s.address().port;` +
    's.close(()=>process.stdout.write(String(p)))});';
  return parseInt(
    execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }).trim(),
    10
  );
}

// Playwright re-evaluates this config in every worker process, so resolve the
// port once and share it through the environment (workers inherit it). Without
// this each worker would pick a different port from the running server.
if (!process.env.JLAB_TEST_PORT) {
  let candidate = findFreePort();
  while (candidate === 8888) {
    candidate = findFreePort();
  }
  process.env.JLAB_TEST_PORT = String(candidate);
}
const port = process.env.JLAB_TEST_PORT;

module.exports = {
  ...baseConfig,
  // Galata reads its server origin from `baseURL` (falling back to
  // http://localhost:8888), so it must match the web server.
  use: {
    ...baseConfig.use,
    baseURL: `http://${HOST}:${port}`
  },
  webServer: {
    // Start a fresh test-configured server on the free port; never reuse an
    // existing server, and never sit on Jupyter's default 8888.
    command: `jupyter lab --config jupyter_server_test_config.py --port=${port} --ServerApp.ip=${HOST}`,
    url: `http://${HOST}:${port}/lab`,
    timeout: 120 * 1000,
    reuseExistingServer: false
  }
};
