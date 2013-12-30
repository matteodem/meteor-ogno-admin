OgnoAdmin.typeFactory = {
    'types' : {}
};

OgnoAdmin.typeFactory.get = function (name) {
    var t = this.types[name];

    if (!_.isObject(t)) {
        return this.types['json'];
    }

    return t;
};

OgnoAdmin.typeFactory.types = {
    'string' : {
        'printValue' : function (val) {
            return val;
        },
        'getInputValue' : function (val) {
            return 'value="' + new Handlebars.SafeString(val) + '"';
        },
        'getDocumentValue' : function (el) {
            return el.val();
        },
        'inputType' : 'text'
    },
    'number' : {
        'printValue' : function (val) {
            return val;
        },
        'getInputValue' : function (val) {
            return 'value="' + val + '"';
        },
        'getDocumentValue' : function (el) {
            return el.val().split('.').length > 1 ? parseFloat(el.val()) : parseInt(el.val(), 10);
        },
        'inputType' : 'number'
    },
    'boolean' : {
        'printValue' : function (val) {
            var icon = val ? 'checkmark' : '';
            return '<i class="' + icon + ' icon"></i>';
        },
        'getInputValue' : function (val) {
            return val ? 'checked="checked"' : '';
        },
        'getDocumentValue' : function (el) {
            return el.is(':checked');
        },
        'inputType' : 'checkbox'
    },
    'json' : {
        'printValue' : function (val) {
            var jsonString = JSON.stringify(val);

            if (_.isString(jsonString) && jsonString.length > 20) {
                return jsonString.slice(0, 20) + '...';
            }

            return jsonString;
        },
        'getInputValue' : function (val) {
            return 'value="' + _.escape(JSON.stringify(val)) + '"';
        },
        'getDocumentValue' : function (el) {
            return el.val().length > 0 ? JSON.parse(el.val()) : '';
        },
        'inputType' : 'text'
    }
};