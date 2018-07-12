var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var babelify = require('babelify');
var watchify = require('watchify');

// this task on its own works
gulp.task('babel', function () {
  return gulp.src("vre/static/vre/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(gulp.dest("build"));
});

// this task should do babelify, browserify ad watchify in one, but isn't functional yet
// sourcemaps don't work yet either
gulp.task('browserify', function() {
	var b = browserify({
    	entries: 'vre/static/vre/main.js',
    	debug: true,
    	cache: {},
    	packageCache: {},
    	plugin: [watchify]
    })
    	.transform(babelify, {"presets": ["env"]})
    	.transform({
        	global: true
   	}, 'browserify-shim');

    return b.bundle()
   		.pipe(source('bundle.js'))
	    .pipe(buffer())
	        .pipe(sourcemaps.init({loadMaps: true}))
	       	// Add transformation tasks to the pipeline here.
	       	//.pipe(uglify())
	    .pipe(gulp.dest('vre/static/vre/'));
});