// PlainList Plugin — theme-hc v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-hc',
    name: 'High Contrast',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#FFFFFF',
        '--surface': '#FFFFFF',
        '--dark':    '#000000',
        '--mid':     '#000000',
        '--muted':   '#444444',
        '--faint':   '#000000',
        '--faint2':  '#EEEEEE',
      });
    }
  });
})();
