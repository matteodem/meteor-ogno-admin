Tinytest.add('OgnoAdmin - Helpers - fakeSimpleSchema', function (test) {
    var fakedSimpleSchema,
        mongodoc = {
        'name' : 'awesome String',
        'pieces' : [1, 2, 3],
        'isCool' : true
    };

    fakedSimpleSchema = OgnoAdmin._helpers.fakeSimpleSchema(mongodoc);

    test.isFalse(fakedSimpleSchema.name.optional);
    test.isFalse(fakedSimpleSchema.pieces.optional);
    test.isFalse(fakedSimpleSchema.isCool.optional);

    test.equal(fakedSimpleSchema.name.type.toString(), 'function String() { [native code] }');
    test.equal(fakedSimpleSchema.pieces.type.toString(), 'function Array() { [native code] }');
    test.equal(fakedSimpleSchema.isCool.type.toString(), 'function Boolean() { [native code] }');

});

Tinytest.add('OgnoAdmin - Helpers - slugify', function (test) {
    test.equal(OgnoAdmin._helpers.slugify('Why???!*123'), 'why123');
    test.equal(OgnoAdmin._helpers.slugify('Pro Static Analytics'), 'pro-static-analytics');
    test.equal(OgnoAdmin._helpers.slugify('UPPERCASE'), 'uppercase');
});

Tinytest.add('OgnoAdmin - Helpers - prettify', function (test) {
    test.equal(OgnoAdmin._helpers.prettify('some_really-bad_name'), 'Some really bad name');
    test.equal(OgnoAdmin._helpers.prettify('UPPERCASE_STRING'), 'Uppercase string');
});