// Karma configuration
// Generated on Tue Sep 02 2014 22:50:00 GMT+0100 (BST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        './bower_components/underscore/underscore.js',
        './bower_components/angular/angular.js',

        // test specific
        './bower_components/jquery/dist/jquery.js',
        './bower_components/angular-mocks/angular-mocks.js',

        // why does sinon let me use this kind of grainy detail?
        './bower_components/sinon/lib/sinon.js',
        './bower_components/sinon/lib/sinon/call.js',
        './bower_components/sinon/lib/sinon/spy.js',
        './bower_components/sinon/lib/sinon/stub.js',
        './bower_components/sinon/lib/sinon/match.js',

        // we want app.js first, after that we don't care
        './src/js/app.js',
        './src/js/**.js',
        'test/spec/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
