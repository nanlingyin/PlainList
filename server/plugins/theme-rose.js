// PlainList Plugin — theme-rose v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-rose',
    name: 'Rose',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#FDF2F4',
        '--surface': '#FFF8F9',
        '--dark':    '#3D0A14',
        '--mid':     '#8B3A4A',
        '--muted':   '#C4849A',
        '--faint':   '#F0D4DA',
        '--faint2':  '#F7E5E9',
      });
    }
  });
})();
