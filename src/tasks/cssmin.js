module.exports = function (grunt, configOptions) {
    'use strict';

    var distFiles = [
            // Main bundle with all the styles on the library
            {
                expand: true,
                cwd: './dist',
                src: ['mapd3.css', '!mapd3.min.css'],
                dest: './dist',
                ext: '.min.css'
            }
        ];

    grunt.config.set('cssmin', {
        dist: {
            files: distFiles
        }
    });
};
