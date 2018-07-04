var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var transform = require('vinyl-transform');

gulp.task('babel', function () {
  return gulp.src("vre/static/vre/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(gulp.dest("build"));
});

gulp.task('browserify', function() {
    var b = browserify({
    	entries: 'build/main.js',
    	debug: true,
    })
    	.transform({
        	global: true
    	}, 'browserify-shim');

    return b.bundle()
        .pipe(source('../vre/static/vre/bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        	// Add transformation tasks to the pipeline here.
        	.pipe(uglify())
        .pipe(gulp.dest('./build/'));
});