
const gulp = require('gulp');
const jasmine = require('gulp-jasmine');
const istanbul = require('gulp-istanbul');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const argv = require('minimist')(process.argv.slice(2));

let srcs = gulp.src([
  // 'server/middleware/*.js',
  // 'server/middleware/**/*.js',
  'lib/**/*.js',
  'common/models/*.js',
]);
let all = gulp.src('test/spec/test-*.js');

function setupEnvVars() {
  process.env.NODE_ENV = 'test';
}

function buildCoverage() {
  return srcs.pipe(istanbul())
    .pipe(istanbul.hookRequire());
}

function runSpecs() {
  let spec;
  let toJasmine = jasmine({
    reporter: new SpecReporter({
      displayStacktrace: 'summary',
    }),
    timeout: 5 * 1000,
  });

  if (argv.filter || argv.f) {
    spec = gulp.src(`test/spec/test\-${argv.filter || argv.f}*.js`)
      .pipe(toJasmine);
    if (argv.coverage || argv.c) {
      spec = spec.pipe(istanbul.writeReports());
    }
  } else {
    spec = all.pipe(toJasmine)
      .pipe(istanbul.writeReports())
      .pipe(istanbul.enforceThresholds({
        thresholds: {global: 30},
      }));
  }
  return spec.on('end', function() {
    process.exit(0);
  }).on('error', function(err) {
    console.log(err);
    process.exit(1);
  });
}

gulp.task('setupEnvVars', setupEnvVars);
gulp.task('build-coverage', buildCoverage);
gulp.task('specs', ['build-coverage', 'setupEnvVars'], runSpecs);

// handle errors
gulp.on('error', function(err) {
  process.exit(1);
});
