var gulp = require('gulp');

var p = require('gulp-load-plugins')({
    pattern: ['*'],
    rename: {
        'gulp-autoprefixer': 'gulp-autoprefixer'
    }
});

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355

var pkg = require('./package.json');
var dirs = pkg.configs.directories;
var browserslist = pkg.browserslist;

var args = p.minimist(process.argv.slice(2)); // eslint-disable-line

// Turn of notify logging to terminal
p.notify.logLevel(0);

// var production = false;
// production = production !== true ? !!args.production : true;

var jsFiles = [
    'gulpfile.js',
    dirs.src + '_scripts/**/*.js',
    '!' + dirs.src + '_scripts/bundle.js',
    '!' + dirs.src + '_scripts/dist/bundle.min.*.js',
    '!' + dirs.src + '_scripts/vendor/**/*.js'
];

const babelConfig = {
    'presets': [[
        '@babel/env', {
            'modules': false
        }
    ]],
    babelrc: false
};



// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('plugins', function () {
    // use like this: gulp plugins --pkg=<packageName>
    var plugin = args.pkg;

    if (plugin) {
        console.log(p[plugin]);
        return;
    }

    console.log(p);
});


gulp.task('colors', function () {
    console.log(p.ansiColors);
});


var reportError = function (error) {
    // [log]
    // console.log(error);

    // Format and ouput the whole error object
    // console.log(error.toString());

    // ----------------------------------------------
    // Pretty error reporting

    var report = '\n';
    // var whiteOnRed = p.ansiColors.white.bgRed;
    var cyan = p.ansiColors.cyan;
    var red = p.ansiColors.red;
    var yellow = p.ansiColors.yellow;
    var green = p.ansiColors.green;
    var underline = p.ansiColors.underline;

    if (error.plugin) {
        report += red('Plugin:');
        report += cyan(' [' + error.plugin + ']\n');
    }

    if (error.relativePath || error.fileName) {
        report += red('File:   ');
        report += underline(yellow(error.relativePath || error.fileName)) + '\n';
    }

    // if (error.line + error.column) {
    //     report += red('Line:   ');
    //     report += green(error.line + ' | ' + error.column)  + '\n';
    // }

    if (error.formatted || error.message) {
        var message = red('If you can read this something went wrong');

        if (error.formatted != undefined) {
            message = error.formatted;
        } else if (error.message != undefined) {
            message = error.message;
        }
        // report += red('Error:\040') + ' ' + error.formatted + '\n';
        report += '\n' + message + '\n';
    }

    if (report === '\n') {
        report += red(error) + '\n';
    }

    console.error(report);

    // ----------------------------------------------
    // Notification
    var notifyMessage = '';

    if (error.line && error.column && error.relativePath) {
        // notifyMessage = error.relativePath + ' | Line: ' + error.line + ':' + error.column;
        notifyMessage = error.relativePath + ' | ' + error.line + ':' + error.column;
    } else {
        notifyMessage = '';
    }

    p.notify({
        title: 'FAIL: ' + error.plugin,
        message: notifyMessage,
        sound: 'Funk' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error);

    // p.util.beep(); // System beep (backup)

    // ----------------------------------------------
    // Prevent the 'watch' task from stopping

    this.emit('end');
};


/*gulp.task('process:scss', function () {
    return gulp.src(dirs.src + '_scss/main.scss')
        .pipe(p.plumber({ errorHandler: reportError }))
        .pipe(p.sourcemaps.init())
        .pipe(p.sass({ outputStyle: 'compressed' })
        // .on('error', p.sass.logError))
        .pipe(p.autoprefixer({ browsers: browserslist }))
        .pipe(p.sourcemaps.write())
        .pipe(p.notify({ title: 'CSS Bundled' }))
        .pipe(gulp.dest(dirs.src + '_css'))
        .pipe(p.browserSync.stream());
});*/

gulp.task('process:scss', function () {
    var plugins = [
        p.autoprefixer({browsers: browserslist, cascade: false})
    ];

    return gulp.src(dirs.src + '_scss/main.scss')
        .pipe(p.plumber({ errorHandler: reportError }))
        .pipe(p.sourcemaps.init())
        .pipe(p.sass())
        // .on('error', p.sass.logError)
        .pipe(p.postcss(plugins))
        .pipe(p.sourcemaps.write('.'))
        .pipe(p.notify({ title: 'CSS Bundled' }))
        .pipe(gulp.dest(dirs.src + '_css/'))
        .pipe(p.browserSync.stream());
});


var rollupJS = function rollupJS(inputFile, options) {
    return function () {
        return p.rollupStream({
            input: options.basePath + inputFile,
            format: options.format,
            name: options.name,
            sourcemap: options.sourcemap,
            plugins: [
                p.rollupPluginNodeResolve(),
                p.rollupPluginCommonjs(),
                p.rollupPluginBabel(babelConfig)
            ]
        })
            .on('error', reportError)
            // point to the entry file.
            .pipe(p.vinylSourceStream(inputFile, options.basePath))
            // we need to buffer the output, since many gulp plugins don't support streams.
            .pipe(p.vinylBuffer())
            .pipe(p.sourcemaps.init({ loadMaps: true }))
            // some transformations like uglify, rename, etc.
            .pipe(p.rename('bundle.js'))
            .pipe(p.sourcemaps.write('.'))
            .pipe(gulp.dest(options.distPath));
    };
};


gulp.task('process:js', rollupJS('main.js', {
    basePath: dirs.src + '_scripts/',
    distPath: dirs.src + '_scripts/',
    format: 'iife',
    name: 'bundle',
    sourcemap: true
}));


gulp.task('lint:js', function (cb) {
    function isFixed (file) {
        // Has ESLint fixed the file contents?
        return file.eslint != null && file.eslint.fixed;
    }

    p.pump([
        gulp.src(jsFiles, { base: './' }),
        // plugins().jscs()
        p.eslint({ fix:true }),
        p.eslint.format(),
        p.if(isFixed, gulp.dest('.')),
        p.eslint.failOnError()
            .on('error', p.notify.onError({
                title: 'FAIL: ESLint',
                message: '<%= error.lineNumber %>: <%= error.message %>'
            }))
    ], cb);
});


gulp.task('watch', function () {
    // With php
    p.connectPhp.server({
        base: dirs.src,
        port: 8010,
        stdio: 'ignore'
    }, function () {
        p.browserSync.init({
            proxy: '127.0.0.1:8010',
            port: 8080,
            notify: false,
            open: false
            // logLevel: 'silent'
        });
    });

    function watchErrorHandler (error) {
        // silently catch 'ENOENT' error typically caused by renaming watched folders
        if (error.code === 'ENOENT') {
            return;
        }
    }

    gulp.watch(dirs.src + '_scss/**/*.scss', ['process:scss'])
        .on('error', watchErrorHandler);

    gulp.watch([
        dirs.src + '**/*.php',
        '!' + dirs.src + '_error/debug.php'
    ])
        .on('change', p.browserSync.reload)
        .on('error', watchErrorHandler);

    gulp.watch(dirs.src + '_grafix/**/*')
        .on('change', p.browserSync.reload)
        .on('error', watchErrorHandler);

    gulp.watch(jsFiles).on('change', function () {
        p.runSequence('lint:js', 'process:js', p.browserSync.reload);
    })
        .on('error', watchErrorHandler);
});




// ---------------------------------------------------------------------
// | MINIFY
// ---------------------------------------------------------------------

function createRandomNumber (min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

var randomNumberCss;
var randomNumberJs;


gulp.task('clean:css', function (done) {
    p.del([dirs.src + '_css/dist/*'])
        .then(function () { done(); });
});


gulp.task('minify:css', function () {
    randomNumberCss = createRandomNumber(10000, 99999);

    var plugins = [
        p.autoprefixer({browsers: browserslist, cascade: false})
    ];

    return gulp.src(dirs.src + '_scss/main.scss')
        .pipe(p.plumber({ errorHandler: reportError }))
        .pipe(p.sass({ outputStyle: 'compressed' }))
        .pipe(p.postcss(plugins))
        .pipe(p.cleanCss({ level:{ 1: { specialComments: 0 }}}))
        .pipe(p.rename('main.min.'+ randomNumberCss +'.css'))
        .pipe(p.notify({ title: 'CSS Bundled' }))
        .pipe(gulp.dest(dirs.src + '_css/dist/'));
});


gulp.task('replace:css', function() {
    gulp.src(dirs.src + '_templates/pagehead.php')
        .pipe(p.plumber({ errorHandler: reportError }))
        .pipe(p.stringReplace(new RegExp('main.min.(.*).css'), 'main.min.' + randomNumberCss + '.css'))
        .pipe(gulp.dest(dirs.src + '_templates/'));
});


gulp.task('clean:js', function (done) {
    p.del([dirs.src + '_scripts/dist/*'])
        .then(function () { done(); });
});


gulp.task('minify:js', function (cb) {
    randomNumberJs = createRandomNumber(10000, 99999);

    p.pump([
        gulp.src(dirs.src + '_scripts/bundle.js'),
        p.uglify(),
        p.rename('bundle.min.' + randomNumberJs + '.js'),
        gulp.dest(dirs.src + '_scripts/dist/')
    ], cb);
});


gulp.task('replace:js', function() {
    gulp.src(dirs.src + '_templates/pagefoot.php')
        .pipe(p.plumber({ errorHandler: reportError }))
        .pipe(p.stringReplace(new RegExp('bundle.min(.*).js'), 'bundle.min.' + randomNumberJs + '.js'))
        .pipe(gulp.dest(dirs.src + '_templates/'));
});


gulp.task('minify:images', function () {
    gulp.src(dirs.src + '_grafix/**/*')
        .pipe(
            p.imagemin([p.imagemin.jpegtran({ progressive: true })], { verbose: true }),
            p.imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false },
                    { removeMetadata: true },
                    { removeDoctype: true },
                    { minifyStyles: true }
                ]
            })
        )
        .pipe(gulp.dest(dirs.dist + '_grafix'))
        .pipe(p.browserSync.stream());
});



// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('build', function (done) {
    p.runSequence(
        ['process:scss', 'lint:js'],
        ['clean:css', 'clean:js', 'process:js'],
        ['minify:css', 'minify:js'],
        ['replace:css', 'replace:js'],
        done
    );
});

gulp.task('default', ['build']);
