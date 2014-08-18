/*global module:false */
/*jshint -W083 */

module.exports = function (grunt) {

    'use strict';

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    var fs = require('fs'),
        path = require('path'),
        crypto = require('crypto');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        vars: {
            src: {
                main: "src/main",
                test: "src/test"
            },
            libs: {
                docs: [
                    'checkSumStore.js',
                    '<%= vars.src.main %>/js/lib/overthrow.js',
                    '<%= vars.src.main %>/js/lib/underscore-min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.2/angular.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.2/angular-route.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.2/angular-touch.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.2/angular-animate.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.2/angular-resource.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.2/angular-sanitize.min.js',
                    '<%= vars.src.main %>/js/lib/angular-scroll.js',
                    '<%= vars.src.main %>/js/lib/fastclick.js',
                    '<%= vars.src.main %>/js/app/config/**/*.js',
                    '<%= vars.src.main %>/js/app/components/**/*.js',
                    '<%= vars.src.main %>/js/app/*.js'
                ],
                dev: [
                    '<%= vars.src.main %>/js/lib/overthrow.js',
                    '<%= vars.src.main %>/js/lib/underscore-min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-route.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-touch.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-animate.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-resource.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-sanitize.js',
                    '<%= vars.src.main %>/js/lib/angular-scroll.js',
                    '<%= vars.src.main %>/js/lib/fastclick.js',
                    '<%= vars.src.main %>/js/app/config/**/*.js',
                    '<%= vars.src.main %>/js/app/components/**/*.js',
                    '<%= vars.src.main %>/js/app/*.js'
                ],
                prod: [
                    'checkSumStore.js',
                    '<%= vars.src.main %>/js/lib/overthrow.min.js',
                    '<%= vars.src.main %>/js/lib/underscore-min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-route.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-touch.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-animate.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-resource.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-sanitize.min.js',
                    '<%= vars.src.main %>/js/lib/angular-scroll.js',
                    '<%= vars.src.main %>/js/lib/fastclick.js',
                    '<%= vars.src.main %>/js/app/config/**/*.js',
                    '<%= vars.src.main %>/js/app/components/**/*.js',
                    '<%= vars.src.main %>/js/app/*.js'
                ]
            },
            target: {
                dist: "dist"
            }
        },
        clean: {
            build: {
                src: [ 'dist', 'checkSumStore.js', 'checkSumStore.json' ]
            }
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        src: [ 'site/partials/**/*.html', 'site/pages/**/*.html', 'site/templates/**/*.html' ],
                        dest: 'build',
                        rename: function(dest, src) {
                            var fileRegex = /^(.*)\.html$/;

                            if(fileRegex.test(src)) {

								var checksumStore = grunt.file.exists('checkSumStore.json');

								if(checksumStore === false) {
									grunt.file.write('checkSumStore.json', JSON.stringify({}, null, 4));
								}

                                var data = grunt.file.read(src);
                                var hash = crypto.createHash('md5').update(data).digest('hex');

                                var choppedSrc = src.match(fileRegex)[1];

                                var newSrc = dest + '/' + choppedSrc + '.checksum.' + hash + '.html';

                                var store = grunt.file.readJSON('checkSumStore.json');
                                store[src] = newSrc;

                                grunt.file.write('checkSumStore.json', JSON.stringify(store, null, 4));

                                src = newSrc;
                            }
                            return src;
                        }
                    }
                ]
            }
        },
        concat: {
            development: {
                options: {
                    // Replace 'use strict' statements with a single one at the top.
                    banner: "'use strict';\n",
                    process: function( src, filepath ) {
                        return '\n// Source: ' + filepath + '\n' +
                            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    },
                    separator: ';'
                },
                src: '<%= vars.libs.dev %>',
                dest: 'dist/js/<%= pkg.name %>.js',
                nonull: true // Warn on missing files.
            },
            production: {
                options: {
                    // Replace 'use strict' statements with a single one at the top.
                    banner: "'use strict';\n",
                    process: function( src, filepath ) {
                        return '\n// Source: ' + filepath + '\n' +
                            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    },
                    separator: ';'
                },
                src: '<%= vars.libs.prod %>',
                dest: 'dist/js/<%= pkg.name %>.js',
                nonull: true // Warn on missing files.
            },
            docsCommon: {
                options: {
                    // Replace 'use strict' statements with a single one at the top.
                    banner: "'use strict';\n",
                    process: function( src, filepath ) {
                        return '\n// Source: ' + filepath + '\n' +
                            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    },
                    separator: ';'
                },
                src: '<%= vars.libs.docs %>',
                dest: 'dist/js/<%= pkg.name %>-docs.js',
                nonull: true // Warn on missing files.
            }
        },
        // Compile CSS.
        compass: {
            options: {
                require: 'susy',
                cssDir: 'dist/css',
                sassDir: '<%= vars.src.main %>/scss/',
                relativeAssets: true,
                force: false // Don't compile if no changes detected
            },
            development: {
                options: {
                    environment: 'development',
                    outputStyle: 'expanded'
                }
            },
            production: {
                options: {
                    environment: 'production',
                    outputStyle: 'compressed'                   
                }
            },
            styleguide: {
                options: {
                    sassDir:    'src/main/scss',
                    specify:    'src/main/scss/peapodLivingStyleGuide.scss',
                    cssDir:     'site/styleguide/css'
                }
            },
            prototypeFonts: {
                options: {
                    sassDir:    'src/main/scss/base/type',
                    specify:    'src/main/scss/base/type/fonts.scss',
                    cssDir:     'site/fonts'
                }
            }
        },
        closurecompiler: {
            minify: {
                options: {
                    // Any options supported by Closure Compiler, for example:
                    "compilation_level": "SIMPLE_OPTIMIZATIONS",

                    // Plus a simultaneous processes limit
                    "max_processes": 40,

                    // And an option to add a banner, license or similar on top
                    "banner": "/* Peapod, LLC */",

                    "warning_level": "QUIET",

                    language_in: 'ECMASCRIPT5_STRICT'
                },
                files: {
                    'dist/js/<%= pkg.name %>.js': [
                        'dist/js/<%= pkg.name %>.js'
                    ]
                }
            }
        },
        ngdocs: {
            options: {
                dest: 'docs',
                scripts: [
                    'http://maps.google.com/maps/api/js?sensor=false',
                    'src/main/js/docs/docs-prefix.js',
                    'dist/js/ziptrip-docs.js' ],
                styles: [ ],
                analytics: {},
                title: 'Peapod Angular API docs',
                startPage: '/api',
                html5Mode: false
            },
            api: {
                src: [ 'src/main/js/app/**/*.js' ],
                title: 'Peapod Angular API docs'
            }
        },
        jshint: {
            files: ['<%= vars.src.main %>/js/app/**/*.js' ], //, '<%= vars.src.test %>/js/**/*.js'],
            options: {
                //devel: true,  // Enable for console logging
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                smarttabs:true,
                expr: true,     // Allows ternary operators
                predef: [
                    'define',
                    'require',
                    'console',
                    'Modernizr',
                    '$',
                    '_',
                    'callbacks',
                    'resx'

                ],
                globals: {
                    _: true,
                    // jQuery: true,
                    FastClick: true,
                    angular: true,
                    google: true,
                    alert: true,
                    IScroll: true,
                    $injector: true,
                    appConfig: true,
                    callbacks: true,
                    resx: true,
                    certonaResx: true,
                    overthrow: true,
                    checksumStore: true
                }
            }
        },
        jasmine: {
            pivotal: {
                src: [
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular.min.js',
                    '<%= vars.src.main %>/js/lib/angular/v1.3/angular-*.js',
                    '<%= vars.src.main %>/js/lib/angular-*.js',
                    '<%= vars.src.main %>/js/lib/underscore-min.js',
                    '<%= vars.src.main %>/js/app/components/**/*.js', 
                    'src/test/**/*.js'
                ],
                options: {
                    specs: 'src/test/spec/*Spec.js',
                    helpers: 'src/test/spec/*Helper.js',
                    keepRunner: true
                }
            }
        },
        watch: {
            js: {
                files: [
                    '<%= vars.src.main %>/js/**/*.js', 
                    '<%= vars.src.test %>/js/**/*.js'
                ],
                tasks: ['preflight', 'clean', 'compass:development', 'concat', 'cacheBust:development']
            },
            scss: {
                files: ['<%= vars.src.main %>/scss/**/*.scss' ],
                tasks: ['preflight', 'clean', 'compass:development', 'concat', 'cacheBust:development']
            },
            pivotal : {
                files: [
                    'src/main/js/lib/angular/v1.3/angular-*.js',
                    'src/main/js/lib/angular-*.js',
                    'src/main/js/app/**/*.js', 
                    'src/test/**/*.js'
                ],
                tasks: 'jasmine:pivotal:build'
            }        
        }
    });

    
    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-contrib-clean');    // https://github.com/gruntjs/grunt-contrib-clean
//    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');   // https://github.com/gruntjs/grunt-contrib-jshint
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-cache-bust');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-closurecompiler');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-ngdocs');

    grunt.task.registerTask('createJsStore', 'Creates a js store from the compiled json file', function() {
        var checksumStore = grunt.file.exists('checkSumStore.json');

        if(checksumStore) {
            var store = grunt.file.readJSON('checkSumStore.json');
            var stringifiedStore = JSON.stringify(store, null, 0);
            var storeScript = 'var checksumStore = ' + stringifiedStore + ';';
            grunt.file.write('checkSumStore.js', storeScript);
        }
    });

    // lint and test(jasmine)
    grunt.registerTask( 'preflight', [ 'jshint', 'jasmine', 'concat:docsCommon', 'ngdocs' ] );

    grunt.registerTask( 'compilestyleguide', ['shell:kssnodeCompile','compass:styleguide']);

    // Default task(s).
    grunt.registerTask('default', [ 'preflight', 'clean', 'compass:development', 'concat:development' ]);
    grunt.registerTask('production', [ 'preflight', 'clean', 'copy', 'createJsStore', 'compass:production', 'concat:production', 'closurecompiler:minify' ]);
    grunt.registerTask('test', [ 'copy' ]);

    grunt.registerTask('build-watch', [ 'default', 'watch' ]);

};
