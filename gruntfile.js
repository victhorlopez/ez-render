module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat_in_order: {
            your_target: {
                files: {
                    'dist/<%= pkg.name %>.js': ['src/*.js', 'src/**/*.js']
                },
                options: {
                    extractRequired: function (filepath, filecontent) {
                        var workingdir = path.normalize(filepath).split(path.sep);
                        workingdir.pop();

                        var deps = this.getMatches(/\*\s*@depend\s(.*\.js)/g, filecontent);
                        deps.forEach(function (dep, i) {
                            var dependency = workingdir.concat([dep]);
                            deps[i] = path.join.apply(null, dependency);
                        });
                        return deps;
                    },
                    extractDeclared: function (filepath) {
                        return [filepath];
                    },
                    onlyConcatRequiredFiles: false
                }
            }
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
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
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
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-concat-in-order');

    grunt.registerTask('test', ['jshint', 'qunit']);

    grunt.registerTask('default', ['jshint', 'qunit', 'concat_in_order', 'uglify']);

};