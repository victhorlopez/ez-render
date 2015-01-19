

module.exports = function (grunt) {

    var path = require('path');
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat_in_order: {
            your_target: {
                files: {
                    'dist/<%= pkg.name %>.js': ['src/ez.render.js', 'src/*?/*.js']
                },
                options: {

                }
            }
        },
        strip_code: {
            options: {
                pattern: /EZ.(require|declare)\((.*?)\);/g
            },
            your_target: {
                src: 'dist/<%= pkg.name %>.js'
            },
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['<%= Object.keys(concat_in_order.your_target.files)[0] %>'] // to extract the destination file from concat
                }
            }
        },
        qunit: {
            files: ['test/**/*.html']
        },
        jshint: {
            files: ['src/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: false,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint', 'qunit']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-concat-in-order');
    grunt.loadNpmTasks('grunt-strip-code');

    grunt.registerTask('test', ['jshint', 'qunit']);

    grunt.registerTask('default', ['qunit', 'jshint', 'concat_in_order', 'strip_code', 'uglify']);

};