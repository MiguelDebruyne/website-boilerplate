var gulp = require('gulp');
var fs = require('fs');
var path = require('path');

var plugins = require('gulp-load-plugins')();
var util = require('gulp-util');

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg.configs.directories;

var production = false;
production = production !== true ? !!util.env.production : true;



// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('process:scss', function () {
    return plugins.rubySass(dirs.src + 'scss/main.scss', { style: 'expanded' })
        .pipe(plugins.autoprefixer({ browsers: ['last 2 versions', 'ie >= 8', '> 1%'] }))
        // .pipe(production ? plugins.minifyCss() : util.noop())
        // .pipe(production ? plugins.rename({ suffix: '.min' }) : util.noop())
        .on('error', plugins.rubySass.logError)
        .pipe(gulp.dest(dirs.src + 'css/'));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + 'js/*.js'
    ])  .pipe(plugins.jscs())
        .pipe(plugins.jscs.reporter())
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('watch', function () {
    gulp.watch(dirs.src + 'scss/**/*.scss', ['process:scss']);
    gulp.watch([dirs.src + 'js/*.js', 'gulpfile.js'], ['lint:js']);
});

gulp.task('clean', function (done) {
    require('del')([
        dirs.archive,
        dirs.dist
    ]).then(function () {
        done();
    });
});


// Copy
// ---------------------------------------------------------------------

gulp.task('copy', [
    'copy:index.html',
    'copy:main.css',
    'copy:main.js',
    'copy:jquery',
    'copy:misc'
]);

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + 'index.html')
        .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:main.css', function () {
    return gulp.src(dirs.src + 'css/main.css')
        .pipe(plugins.autoprefixer({ browsers: ['last 2 versions', 'ie >= 8', '> 1%'] }))
        .pipe(plugins.minifyCss())
        .pipe(gulp.dest(dirs.dist + 'css/'));
});

gulp.task('copy:main.js', function () {
    return gulp.src(dirs.src + 'js/main.js')
        .pipe(plugins.uglify())
        .pipe(gulp.dest(dirs.dist + 'js'));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
        .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
        .pipe(gulp.dest(dirs.dist + 'js/vendor'));
});

gulp.task('copy:misc', function () {
    return gulp.src([
        dirs.src + '/**/*',
        '!' + dirs.src + 'index.html',
        '!' + dirs.src + 'css{,/**}',
        '!' + dirs.src + 'scss{,/**}',
        '!' + dirs.src + 'js/*.js'
    ], {
        dot: true
    }).pipe(gulp.dest(dirs.dist));
});


// Archive
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '_v' + pkg.version + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath).mode
        });

    });

    archiver.pipe(output);
    archiver.finalize();
});



// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
    done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean', 'process:scss', 'lint:js'],
        'copy',
    done);
});

gulp.task('default', ['build']);
