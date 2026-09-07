// Karma configuration
// Generated on Tue Nov 02 2021 15:28:33 GMT+0100 (Mitteleuropäische Normalzeit)

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['jasmine', 'detectBrowsers'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-detect-browsers') // Include the plugin
    ],

    // list of files / patterns to load in the browser
    files: [
      'distrib/jsxgraphsrc.js',
      { pattern: 'test/test*.js', watched: true }
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    // browsers: ['ChromeHeadless'],
    // browsers: ['Firefox'],
    // browsers: ['ChromeHeadless'],
    // browsers: ['ChromiumHeadless'],

    detectBrowsers: {
      // Enable headless mode if you prefer UI-less execution (e.g., CI pipelines)
      preferHeadless: true, 

      // Post-detection filter: strictly keep Chrome or Chromium variants
      postDetection: function(availableBrowsers) {
        const targets = ['ChromeHeadless', 'ChromiumHeadless', 'Chrome', 'Chromium'];
        return availableBrowsers.filter(browser => targets.includes(browser));
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: Infinity
  })
}
