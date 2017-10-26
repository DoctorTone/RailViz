var gulp = require("gulp");
var babel = require("gulp-babel");
var changed = require("gulp-changed");

gulp.task("build", ["compile", "min-copy"], function() {

});

var DEST = "./temp/js";
gulp.task("compile", function() {
    return gulp.src(["./js/*.js", "!./js/*.min.js"])
        .pipe(changed(DEST))
        .pipe(babel())
        .pipe(gulp.dest(DEST));
});

gulp.task("min-copy", function() {
    gulp.src("./js/*.min.js")
        .pipe(gulp.dest("./build/js"));
    gulp.src("./css/*.min.css")
        .pipe(gulp.dest("./build/css"));
});
