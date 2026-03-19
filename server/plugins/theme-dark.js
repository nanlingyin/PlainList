// PlainList Plugin — theme-dark v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-dark',
    name: 'Dark',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#0F0F0F',
        '--surface': '#1A1A1A',
        '--dark':    '#EFEFEF',
        '--mid':     '#AAAAAA',
        '--muted':   '#666666',
        '--faint':   '#2C2C2C',
        '--faint2':  '#222222',
      });
    }
  });
})();
