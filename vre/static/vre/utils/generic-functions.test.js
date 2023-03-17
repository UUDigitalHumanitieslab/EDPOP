import assert from 'assert';
import sinon from 'sinon';

import Cookies from 'jscookie';

import {
    objectAsUrlParams,
    addCSRFToken,
    canonicalSort,
} from './generic-functions';

describe('generic functions', function() {
    describe('objectAsUrlParams', function() {
        it('converts empty object to empty string', function() {
            assert(objectAsUrlParams({}) === '');
        });

        it('handles strings, numbers and booleans', function() {
            assert(objectAsUrlParams({name: 'john'}) === 'name=john');
            assert(objectAsUrlParams({age: 3}) === 'age=3');
            assert(objectAsUrlParams({happy: true}) === 'happy=true');
        });

        it('handles multiple keys', function() {
            assert(objectAsUrlParams({
                name: 'john',
                age: 3,
                happy: true,
            }) === 'name=john&age=3&happy=true');
        });
    });

    describe('addCSRFToken', function() {
        before(function() {
            this.cookieJar = {csrftoken: 'abc123'};
            sinon.replace(Cookies, 'get', sinon.fake(key =>
                this.cookieJar[key]
            ));
        });

        after(function() {
            sinon.restore();
            delete this.cookieJar;
        });

        it('inserts the X-CSRFToken header', function() {
            var input = {url: 'https://testing.test'};
            var result = addCSRFToken(input);
            assert(result !== input);
            assert(result.url === input.url);
            assert(result.headers);
            assert(result.headers['X-CSRFToken'] === 'abc123');
        });

        it('overrides a preset csrftoken', function() {
            var input = {headers: {'X-CSRFToken': 'def456'}};
            var result = addCSRFToken(input);
            assert(result.headers['X-CSRFToken'] === 'abc123');
        });

        it('does not modify the input', function() {
            var input = {headers: {'X-CSRFToken': 'def456'}};
            var result = addCSRFToken(input);
            assert(input.headers['X-CSRFToken'] === 'def456');
        });

        it('retains other headers', function() {
            var input = {url: 'https://testing.test', headers: {hi: 'there'}};
            var result = addCSRFToken(input);
            assert(result.headers.hi === input.headers.hi);
            assert(result.headers['X-CSRFToken'] === 'abc123');
        });
    });

    describe('canonicalSort', function() {
        it('sorts Title before Author', function() {
            assert(canonicalSort('Title') < canonicalSort('Author'));
        });

        it('sorts Author before Collaborator', function() {
            assert(canonicalSort('Author') < canonicalSort('Collaborator'));
        });

        it('defaults to lowest priority', function() {
            assert(canonicalSort('banana') === 100);
        });
    });
});
