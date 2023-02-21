import _ from 'underscore';
import wontache from 'rollup-plugin-wontache';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

var underscorePattern = /node_modules\/underscore($|\/)/;
var extension = /.js$/;

export default {
    input: 'vre/main.js',
    external: ['jquery', 'lodash', underscorePattern, 'backbone'],
    plugins: [
        wontache(),
        nodeResolve(),
        commonjs(),
    ],
    output: {
        file: 'vre/bundle.js',
        format: 'iife',
        globals(id) {
            switch (id) {
                case 'jquery': return 'jQuery';
                case 'lodash': return '_';
                case 'underscore': return '_';
                case 'backbone': return 'Backbone';
            }
            var lastPart = _.last(id.split('/')).replace(extension, '');
            if (lastPart === 'underscore') return '_';
            return '_.' + lastPart;
        },
        plugins: [terser()],
        sourcemap: true,
    },
};
