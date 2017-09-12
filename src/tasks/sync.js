module.exports = function(grunt) {
    'use strict';

    grunt.config.set('sync', {
        fonts:{
            files:[{
                cwd:'src/doc/template/static/fonts/',
                src: ['**'],
                dest: 'docs/fonts/'
            }],
            verbose: true
        },
        manifest:{
            files:[{
                cwd:'src/doc/template/',
                src: ['manifest.json'],
                dest: 'docs/'
            }],
            verbose: true
        }
    });
}
