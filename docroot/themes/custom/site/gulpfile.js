// Configurations
let config = {
    settings: require('./src/compile-settings.json')
};


// Output the error to the terminal instead of dying out
function swallowError(error) {

    // If you want details of the error in the console
    console.log(error.toString());

    this.emit('end');
}


// Load plugins
const gulp = require('gulp');
const bless = require('gulp-bless');
const babel = require('gulp-babel');
const cssnano = require('gulp-cssnano');
const styles = require('gulp-sass');
const del = require('del');
const minify = require('gulp-minify');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence');


// Builders
gulp.task('build:styles', (callback) => {
    runSequence('clean:styles', 'process:styles_vih', 'process:styles_vies', callback);
});
gulp.task('build:javascripts', (callback) => {
    runSequence('clean:javascripts', 'process:javascripts', callback);
});
gulp.task('build:fonts', (callback) => {
    runSequence('clean:fonts', 'process:fonts', callback);
});
gulp.task('build:images', (callback) => {
    runSequence('clean:images', 'process:images', callback);
});


// Processors
gulp.task('process:styles_vih', () => {
  return gulp.src(config.settings.styles_vih)
      .pipe(sourcemaps.init())
      .pipe(styles().on('error', swallowError))
      .pipe(autoprefixer('last 2 version'))
      .pipe(bless())
      .pipe(sourcemaps.write())
      .pipe(cssnano())
      .pipe(gulp.dest('dist/stylesheets'))
      .pipe(browserSync.stream({match: '**/*.css'}));
});
gulp.task('process:styles_vies', () => {
  return gulp.src(config.settings.styles_vies)
      .pipe(sourcemaps.init())
      .pipe(styles().on('error', swallowError))
      .pipe(autoprefixer('last 2 version'))
      .pipe(bless())
      .pipe(sourcemaps.write())
      .pipe(cssnano())
      .pipe(gulp.dest('dist/stylesheets'))
      .pipe(browserSync.stream({match: '**/*.css'}));
});
gulp.task('process:javascripts', () => {
    return gulp.src(config.settings.javascripts)
        .on('error', swallowError)
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(concat('app.js'))
        //.pipe(sourcemaps.write())
        .pipe(minify({
            ext:{
                min:'.min.js'
            }
        }))
        .pipe(gulp.dest('dist/javascripts'));
});
gulp.task('process:fonts', () => {
    return gulp.src(config.settings.fonts)
        .pipe(gulp.dest('dist/fonts'));
});
gulp.task('process:images', () => {
    return gulp.src('src/images/**/*.+(png|jpg|gif|svg)')
        .pipe(
            imagemin({
                optimizationLevel: 5,
                progressive: true,
                interlaced: true
            })
        )
        .pipe(gulp.dest('dist/images'));
});


// Cleaners
gulp.task('clean:styles', () => {
    return del(['dist/stylesheets']);
});
gulp.task('clean:javascripts', () => {
    return del(['dist/javascripts/*.js', '!dist/javascripts/modernizr.js', '!dist/javascripts/modernizr.min.js']);
});
gulp.task('clean:images', () => {
    return del(['dist/images']);
});
gulp.task('clean:fonts', () => {
    return del(['dist/fonts']);
});


// Reloaders
gulp.task('reload:javascripts', () => {
    return browserSync.reload();
});
gulp.task('reload:fonts', () => {
    return browserSync.reload();
});
gulp.task('reload:images', () => {
    return browserSync.reload();
});
gulp.task('reload:template', () => {
    return browserSync.reload();
});


// Watchers
gulp.task('watcher:styles', (callback) => {
    runSequence('build:styles', callback);
});
gulp.task('watcher:javascripts', (callback) => {
    runSequence('build:javascripts', 'reload:javascripts', callback);
});
gulp.task('watcher:fonts', (callback) => {
    runSequence('build:fonts', 'reload:fonts', callback);
});
gulp.task('watcher:images', (callback) => {
    runSequence('build:images', 'reload:images', callback);
});
gulp.task('watcher:templates', (callback) => {
    runSequence('reload:template', callback);
});


// Tasks
gulp.task('default', (callback) => {
    runSequence('build', 'watch', callback);
});

gulp.task('watch', ['build'], () => {
    gulp.watch('src/styles/**/*.scss', ['watcher:styles']);
    gulp.watch('src/javascripts/**/*.js', ['watcher:javascripts']);
    gulp.watch('src/fonts/**/*.+(eot|svg|ttf|woff|woff2)', ['watcher:fonts']);
    gulp.watch('src/images/**/*.+(png|jpg|gif|svg)', ['watcher:images']);
    gulp.watch('**/*.+(twig|twig.html|tpl|tpl.php|html)', ['watcher:templates']);

    // Browser sync
    browserSync.init(['dist/stylesheets/*.css', 'dist/javascripts/*.js'], {
        proxy: config.settings.options.proxy
    });
});
gulp.task('build', (callback) => {
    runSequence(['build:images', 'build:fonts', 'build:javascripts', 'build:styles'], callback);
});
