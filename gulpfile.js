var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
//var transform = require('vinyl-transform');
var babelify = require('babelify');
var watchify = require('watchify');

gulp.task('babel', function () {
  return gulp.src("vre/static/vre/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(gulp.dest("build"));
});

gulp.task('watchify', function() {
	//var args = merge(watchify.args, { debug: true });
	var input = watchify(b);
	return bundle_es6(input);
	input.on('update', function () {
    	return bundle_es6(input);
  	});
});

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
   		.pipe(source('../vre/static/vre/main.js'))
	        //.pipe(buffer())
	        //.pipe(sourcemaps.init({loadMaps: true}))
	       	// Add transformation tasks to the pipeline here.
	       	//.pipe(uglify())
	        .pipe(gulp.dest('./build'));
});

function bundle_es6(input) {
	return input.bundle()
        .pipe(source('../vre/static/vre/bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        	// Add transformation tasks to the pipeline here.
        	//.pipe(uglify())
        .pipe(gulp.dest('./build/'));
}