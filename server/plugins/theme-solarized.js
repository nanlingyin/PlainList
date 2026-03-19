// PlainList Plugin — theme-solarized v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-solarized',
    name: 'Solarized',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#FDF6E3',
        '--surface': '#EEE8D5',
        '--dark':    '#073642',
        '--mid':     '#586E75',
        '--muted':   '#93A1A1',
        '--faint':   '#D3CBB8',
        '--faint2':  '#E8E2D0',
      });
    }
  });
})();
