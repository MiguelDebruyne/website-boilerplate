var gulp = require('gulp');

var p = require('gulp-load-plugins')({
    pattern: ['*']
});

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg.configs.directories;

var args = p.minimist(process.argv.slice(2)); // eslint-disable-line

// Turn of notify logging to terminal
p.notify.logLevel(0);

var production = false;
production = production !== true ? !!args.production : true;

var jsFiles = [
    'gulpfile.js',
    dirs.src + '_scripts/*.js',
    '!' + dirs.src + '_scripts/vendor/*.js'
];

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
    //console.log(error);

    // Format and ouput the whole error object
    //console.log(error.toString());

    // ----------------------------------------------
    // Pretty error reporting

    var report = '\n';
    // var whiteOnRed = p.ansiColors.white.bgRed;
    var cyan = p.ansiColors.cyan;
    var red = p.ansiColors.red;
    var yellow = p.ansiColors.yellow;
    var underline = p.ansiColors.underline;

    if (error.plugin) {
        report += red('Plugin:');
        report += cyan(' [' + error.plugin + ']\n');
    }

    if (error.relativePath) {
        report += red('File:') + underline(yellow(error.relativePath)) + '\n';
    }

    if (error.formatted) {
        // report += red('Error:\040') + ' ' + error.formatted + '\n';
        report += error.formatted + '\n';
    }

    console.error(report);

    // ----------------------------------------------
    // Notification
    var notifyMessage = '';

    if (error.line && error.column && error.relativePath) {
        notifyMessage = yellow(error.relativePath) + ' | Line: ' + error.line + ':' + error.column;
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

gulp.task('process:scss', function () {
    if (production) {
        return gulp.src(dirs.src + '_scss/main.scss')
            .on('error', p.notify.onError({ title: 'SASS error' }))
            .pipe(p.plumber({ errorHandler: reportError }))
            .pipe(p.sass({ outputStyle: 'compressed' })/*.on('error', p.sass.logError)*/)
            .pipe(p.autoprefixer({ browsers: ['last 2 versions', 'ie >= 9', '> 1%'] }))
            .pipe(p.cleanCss({ level:{ 1: { specialComments: 0 }}}))
            .pipe(p.notify({ title: 'CSS Bundled' }))
            .pipe(gulp.dest(dirs.src + '_css'));
    }

    return gulp.src(dirs.src + '_scss/main.scss')
        .on('error', p.notify.onError({ title: 'SASS error' }))
        .pipe(p.plumber({ errorHandler: reportError }))
        .pipe(p.sourcemaps.init())
        .pipe(p.sass({ outputStyle: 'compressed' }))
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

function isFixed (file) {
    // Has ESLint fixed the file contents?
    return file.eslint != null && file.eslint.fixed;
}

gulp.task('lint:js', function () {
    return gulp.src(jsFiles, { base: './' })
        .pipe(p.eslint({ fix:true }))
        .pipe(p.eslint.format())
        .pipe(p.if(isFixed, gulp.dest('.')))
        .pipe(p.eslint.failOnError());
});

gulp.task('process:images', function () {
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
        done
    );
});

gulp.task('default', ['build']);
