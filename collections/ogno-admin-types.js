OgnoAdmin.typeFactory = {
    'types' : {}
};

/**
 * Returns a type defined in OgnoAdmin.typeFactory.types, if none found: use json.
 *
 * @param {Object} config
 * @returns {Object}
 */
OgnoAdmin.typeFactory.get = function (config) {
    var t = this.types[config.type];

    if (config.references) {
        return this.types.collection(OgnoAdmin.getCollection(config.references), config);
    }

    if (!_.isObject(t)) {
        return this.types['json'];
    }

    return t;
};

/**
 * Contains all the types for presenting html input.
 *
 * @type {Object}
 */
OgnoAdmin.typeFactory.types = {
    'string' : {
        'printValue' : function (val) {
            var regex = SchemaRegEx.FilePickerImageUrl.exec(val);

            if (regex && val === regex.shift()) {
                return '<img class="ui small image" src="' + val + '"/>';
            }

            return val;
        }
    },
    'number' : {
        'printValue' : function (val) {
            return val;
        }
    },
    'boolean' : {
        'printValue' : function (val) {
            var icon = val ? 'checkmark' : 'ban circle';
            return '<i class="' + icon + ' icon"></i>';
        }
    },
    'collection' : function (collection, config) {
        return {
            'printValue' : function (val) {
                var htmlString = '<ul>';

                val = _.isArray(val) ? val : [val];

                _.each(val, function (el) {
                    var doc = collection.findOne(el);

                    if (_.isObject(doc)) {
                        htmlString += '<li>' + doc[config.field] +  '</li>';
                    }
                });

                htmlString += '</ul>';

                return htmlString;
            }
        };
    },
    'json' : {
        'printValue' : function (val) {
            var jsonString = JSON.stringify(val);

            if (_.isString(jsonString) && jsonString.length > 40) {
                return jsonString.slice(0, 40) + '...';
            }

            return jsonString;
        }
    }
};