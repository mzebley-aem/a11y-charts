// Serves the built docs site (docs/dist) for browser tests. The docs are fully
// static, so Python's file server is enough; build them first with
// `npm run docs:build`.
export function docsServer(port) {
  return {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory ../../docs/dist`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
  };
}
