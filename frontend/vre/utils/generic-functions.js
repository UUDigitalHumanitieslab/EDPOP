import _ from 'lodash';

/**
 * Perform the following transformation:
 * (from)  {foo: 'bar', foobar: 'baz'}
 * (to)    'foo=bar&foobar=baz'
 */
export function objectAsUrlParams(object) {
    return _(object).entries().invokeMap('join', '=').join('&');
}

export function canonicalSort(key) {
    var index = (canonicalOrder[key] || 100);
    return index;
}

var canonicalOrder = {
    'Title': 1,
    'Uniform Title': 4,
    'Varying Form of Title': 5,
    'Author': 8,
    'Collaborator': 12,
    'Production': 16,
    'Publisher': 20,
    'Added Entry - Corporate Name': 24,
    'Extent': 28,
    'Language': 32,
    'Citation/Reference': 36,
    'Location of Originals': 40,
    'Note': 44,
    'With Note': 48,
    'Subject Headings': 52,
};
