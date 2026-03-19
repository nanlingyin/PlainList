// PlainList Plugin — theme-nord v1.0.0
(function () {
  if (typeof PluginRuntime === 'undefined') return;
  PluginRuntime.register({
    id: 'theme-nord',
    name: 'Nord',
    version: '1.0.0',
    setup(api) {
      api.theme({
        '--bg':      '#2E3440',
        '--surface': '#3B4252',
        '--dark':    '#ECEFF4',
        '--mid':     '#D8DEE9',
        '--muted':   '#7B88A1',
        '--faint':   '#434C5E',
        '--faint2':  '#3B4252',
      });
    }
  });
})();
