// PlainList Plugin — theme-warm v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-warm',
    name: 'Warm',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#F5F0E8',
        '--surface': '#FDFAF4',
        '--dark':    '#2C1F0E',
        '--mid':     '#6B5744',
        '--muted':   '#A08C78',
        '--faint':   '#E2D8CC',
        '--faint2':  '#EDE8DF',
      });
    }
  });
})();
