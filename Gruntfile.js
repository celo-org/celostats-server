var scripts = [
  'src/client/js/app.js',
  'src/client/js/controllers.js',
  'src/client/js/filterFunctions.js',
  'src/client/js/filters.js',
  'src/client/js/directives.js'
];

var vendor = [
  'node_modules/jquery/dist/jquery.js',
  'node_modules/popper.js/dist/umd/popper.js',
  'node_modules/bootstrap/dist/js/bootstrap.js',
  'node_modules/angular/angular.js',
  'node_modules/ngstorage/ngStorage.js',
  'node_modules/lodash/lodash.js',
  'node_modules/d3/dist/d3.js',
  'node_modules/d3-tip/dist/index.js',
  'node_modules/moment/moment.js',
  'node_modules/moment/locale/en.js',
  'node_modules/toastr/toastr.js',
  'node_modules/jquery-sparkline/jquery.sparkline.js'
];

var styles = [
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/bootstrap/dist/css/bootstrap.min.css.map',
  'src/client/css/minimal-icons-embedded.css',
  'node_modules/toastr/build/toastr.min.css',
  'src/client/css/style.css'
];

module.exports = function (grunt) {
  scripts.unshift(
    grunt.option('configPath') || 'src/client/js/defaultConfig.js'
  );

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: ['dist', 'coverage', '.nyc_output'],
      js: ['dist/js/*.*', '!dist/js/netstats.*', '!dist/js/vendor.*'],
      css: ['dist/css/*.css', '!dist/css/netstats.*.css']
    },
    watch: {
      css: {
        files: ['src/client/css/*.css'],
        tasks: ['default']
      },
      js: {
        files: ['src/client/js/*.js'],
        tasks: ['default']
      },
      html: {
        files: ['src/client/views/*.jade'],
        tasks: ['default']
      }
    },
    pug: {
      build: {
        options: {
          data: {
            debug: false,
            pretty: true
          }
        },
        files: {
          'dist/index.html': 'src/client/views/index.jade'
        }
      }
    },
    copy: {
      build: {
        files: [
          {
            expand: true,
            cwd: 'src/client/fonts/',
            src: ['*.*'],
            dest: 'dist/fonts/',
            filter: 'isFile'
          },
          {
            expand: true,
            cwd: 'src/client/images/',
            src: ['*.*'],
            dest: 'dist/',
            filter: 'isFile'
          },
          {
            expand: true,
            flatten: true,
            src: styles,
            dest: 'dist/css/',
            filter: 'isFile'
          }
        ]
      }
    },
    cssmin: {
      build: {
        files: [{
          expand: true,
          cwd: 'dist/css',
          src: ['*.css', '!*.min.css'],
          dest: 'dist/css/'
        }]
      }
    },
    concat: {
      vendor: {
        src: vendor,
        dest: 'dist/js/vendor.js'
      },
      netstats: {
        options: {
          separator: ';\n'
        },
        src: scripts,
        dest: 'dist/js/netstats.js'
      },
      css: {
        src: [
          'dist/css/*.min.css',
          'dist/css/*.css'
        ],
        dest: 'dist/css/netstats.min.css'
      }
    },
    uglify: {
      netstats: {
        options: {
          mangle: false,
          sourceMap: true,
          compress: true
        },
        src: ['<%= concat.netstats.dest %>'],
        dest: 'dist/js/netstats.min.js'
      },
      vendor: {
        options: {
          mangle: true,
          sourceMap: true,
          compress: true
        },
        src: ['<%= concat.vendor.dest %>'],
        dest: 'dist/js/vendor.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-pug');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', [
    'clean:build',
    'copy:build',
    'pug:build',

    'cssmin:build',
    'concat:css',

    'concat:vendor',
    'concat:netstats',

    'uglify:netstats',
    'uglify:vendor',

    'clean:js',
    'clean:css'
  ]);
};

