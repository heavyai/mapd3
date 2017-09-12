module.exports = function(grunt) {
    'use strict';

    grunt.config.set('watch', {
        readme: {
            files: ['README.md'],
            tasks: ['jsdoc:dist']
        },
        fonts:{
            files:['src/doc/template/static/fonts/**'],
            tasks:['sync:fonts']
        },
        manifest:{
            files:['src/doc/template/manifest.json'],
            tasks:['sync:manifest']
        },
        tmpl:{
            files:['src/doc/template/tmpl/*.tmpl'],
            tasks: ['jsdoc:dist']
        }
    });
}
