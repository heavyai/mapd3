module.exports = function (grunt) {
    'use strict';

    var distFiles = [
            // Main bundle with all the styles on the library
            {
                expand: true,
                cwd: 'src/styles/',
                src: ['mapd3.scss'],
                dest: './dist',
                ext: '.css'
            }
        ];

    grunt.config.set('sass', {
        dist: {
            options: {
                style: 'expanded'
            },
            files: distFiles
        }
    });
};
