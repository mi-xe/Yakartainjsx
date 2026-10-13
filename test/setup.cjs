const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});

global.window = dom.window;
global.localStorage = dom.window.localStorage;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.HTMLElement = dom.window.HTMLElement;
global.FormData = dom.window.FormData;
global.Node = dom.window.Node;
global.MutationObserver = dom.window.MutationObserver;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

require('@babel/register')({
  extensions: ['.js', '.jsx'],
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
  ],
  ignore: [/node_modules/],
});


jasmine.getEnv().addReporter({
  specDone(result) {
    const passed = result.status === 'passed';
    const failed = result.status === 'failed';

    const icon = passed ? '[OK]' : failed ? '[FALLO]' : '[OMITIDA]';

    console.log(`${icon} ${result.fullName}`);

    if (failed) {
      result.failedExpectations.forEach((error) => {
        console.log(`  Error: ${error.message}`);

        if (error.stack) {
          console.log(error.stack);
        }
      });
    }
  },

  jasmineDone(result) {
    console.log(`\nResultado final: ${result.overallStatus}`);
  }
});
