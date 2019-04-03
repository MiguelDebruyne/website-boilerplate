var gulp = require('gulp');

var p = require('gulp-load-plugins')({
    pattern: ['*']
});

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg.configs.directories;

var production = false;
production = production !== true ? !!p.util.env.production : true;

var jsFiles = [
    'gulpfile.js',
    dirs.src + '_scripts/*.js',
    '!' + dirs.src + '_scripts/vendor/*.js'
];

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('plugins', function () {
    // use like this: gulp --pkg=<packageName>
    var plugin = p.util.env.pkg;

    if (plugin) {
        console.log(p[plugin]);
        return;
    }

    console.log(p);
});

var sass = require('gulp-sass');

var reportError = function (error) {
    // [log]
    //console.log(error);

    // Format and ouput the whole error object
    //console.log(error.toString());


    // ----------------------------------------------
    // Pretty error reporting

    var report = '\n';
    // var whiteOnRed = p.util.colors.white.bgRed;
    var cyan = p.util.colors.cyan;
    var red = p.util.colors.red;
    var yellow = p.util.colors.yellow;
    var underline = p.util.colors.underline;

    if (error.plugin) {
        report += red('Plugin:');
        report += cyan(' [' + error.plugin + ']\n');
    }

    if (error.relativePath) {
        report += red('File:\0o40\0o40\0o40') + underline(yellow(error.relativePath)) + '\n';
    }

    if (error.formatted) {
        report += red('Error:\040') + ' ' + error.formatted + '\n';
    }

    console.error(report);


    // ----------------------------------------------
    // Notification

    if (error.line && error.column && error.relativePath) {
        var notifyMessage = yellow(error.relativePath) + ' | Line: ' + error.line + ':' + error.column;
    } else {
        var notifyMessage = '';
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
}

gulp.task('process:scss', function () {
    if (production) {
        return gulp.src(dirs.src + '_scss/main.scss')
            .pipe(p.sass({ outputStyle: 'compressed' }).on('error', p.sass.logError))
            .on('error', p.notify.onError({ title: 'scss error' }))
            .pipe(p.autoprefixer({ browsers: ['last 2 versions', 'ie >= 9', '> 1%'] }))
            .pipe(p.cleanCss({ level:{ 1: { specialComments: 0 }}}))
            .pipe(p.notify({ title: 'CSS Bundled' }))
            .pipe(gulp.dest(dirs.src + '_css'));
    }

    return gulp.src(dirs.src + '_scss/main.scss')
        // .pipe(p.plumber({errorHandler: p.notify.onError("Error: <%= error.message %>")}))
        .pipe(p.sourcemaps.init())
        .pipe(p.plumber({
                    errorHandler: reportError
                }))
        .pipe(p.sass({ outputStyle: 'compressed' }))
            // .on('error', p.sass.logError)
            // .on('error', p.notify.onError({ title: 'SASS error' }))

        .pipe(p.autoprefixer({ browsers: ['last 2 versions', 'ie >= 9', '> 1%'] }))
        .pipe(p.sourcemaps.write())
        .pipe(p.notify({ title: 'CSS Bundled' }))
        .pipe(gulp.dest(dirs.src + '_css'))
        .pipe(p.browserSync.stream());
});

// gulp.task('lint:js', () =>
//   gulp.src([
//     'gulpfile.js',
//     `${dirs.src}/js/*.js`,
//     `${dirs.test}/*.js`
//   ]).pipe(plugins().jscs())
//     .pipe(plugins().eslint())
//     .pipe(plugins().eslint.failOnError())
// );

gulp.task('lint:js', function () {
    return gulp.src(jsFiles)
        // .pipe(p.jscs())
        // .pipe(p.jscs.reporter())
        // .on('error', function () { this.emit('end'); })
        // .on('error', p.notify.onError({ title: 'jscs error' }))
        .pipe(p.eslint())
        .pipe(p.eslint.failOnError())
});

gulp.task('process:images', function () {
    gulp.src(dirs.src + '_grafix/**/*')
        .pipe(p.imagemin([
            p.imagemin.jpegtran({ progressive: true })], { verbose: true }),
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

gulp.task('watch', function () {
    // With php
    p.connectPhp.server({
        base: dirs.src,
        port: 8010
    }, function () {
        p.browserSync.init({
            proxy: '127.0.0.1:8010',
            notify: false,
            port: 8080,
            open: false
        });
    });

    gulp.watch(dirs.src + '_scss/**/*.scss', ['process:scss']);
    gulp.watch(dirs.src + '**/*.php').on('change', p.browserSync.reload);
    gulp.watch(dirs.src + '_grafix/**/*').on('change', p.browserSync.reload);

    gulp.watch(jsFiles).on('change', function () {
        runSequence('lint:js', p.browserSync.reload);
    });
});


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('build', function (done) {
    runSequence(
        ['process:scss', 'lint:js'],
    done);
});

gulp.task('default', ['build']);
