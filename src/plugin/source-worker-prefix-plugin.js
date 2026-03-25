function rewriteSourceWorkerImports(code = '') {
  let rewritten = code

  rewritten = rewritten.replace(/(['"])shared-worker:([^'"\n]+)\1/g, '$1$2?sharedworker$1')
  rewritten = rewritten.replace(/(['"])web-worker:([^'"\n]+)\1/g, '$1$2?worker$1')

  return rewritten
}

function createSourceWorkerPrefixPlugin() {
  return {
    name: 'version-watcher-source-worker-prefix',
    enforce: 'pre',
    transform(code) {
      if (!code || (!code.includes('shared-worker:') && !code.includes('web-worker:'))) {
        return null
      }

      const rewritten = rewriteSourceWorkerImports(code)
      if (rewritten === code) {
        return null
      }

      return {
        code: rewritten,
        map: null,
      }
    },
  }
}

module.exports = {
  rewriteSourceWorkerImports,
  createSourceWorkerPrefixPlugin,
}
