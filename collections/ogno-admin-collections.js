(function () {
    var pagination;

    /**
     * Returns the current selected collection with help of the Session object.
     *
     * @returns {Object}
     */
    function getCollection() {
        var c,
            v = Session.get('ognoAdminCurrentView');

        if (v && v.type && v.type.reference) {
            c = OgnoAdmin.getCollection(v.type.reference);
        }

        return "object" === typeof c ? c : { 'simpleSchema' : function () {} };
    }

    /**
     * Returns the current configuration for the view.
     *
     * @returns {Object}
     */
    function getConfig() {
        var v = Session.get('ognoAdminCurrentView');

        if (v) {
            return v.config;
        }
    }

    /**
     * Returns a valid html representation of the value.
     *
     * @param {*} val
     * @param {Object} config
     * @returns {string}
     */
    function printValue(val, config) {
        if (!config) {
            return val;
        }

        return OgnoAdmin.typeFactory.get(config).printValue(val);
    }

    /**
     * Returns a document, enhanced with the filepicker images.
     *
     * @param {Object} doc
     * @returns {Object}
     */
    function getImageValues(doc) {
        $('.imageField .image.button').each(function () {
            var url = $(this).attr('data-url');

            if (_.isString(url) && url.length > 10) {
                doc[$(this).attr('data-key')] = $(this).attr('data-url');
            }
        });

        return doc;
    }

    /**
     * Insert an item at a specific position of an array.
     *
     * @param {Array} array
     * @param {Number} index
     * @param {*} item
     *
     * @returns {Array}
     */
    function insertAt(array, index, item) {
        array.splice(index, 0, item);
        return array;
    }

    Template.ognoAdminEditForm.ognoAdminOptions = function () {
        var that = this;

        if (_.isObject(this.value.ognoAdmin) && _.isObject(this.value.ognoAdmin.references)) {
            return _.map(this.value.ognoAdmin.references.find().fetch(), function (doc) {
                var field = doc[that.value.ognoAdmin.field];

                field = field ? field : doc._id;

                return { label : field, value: doc._id };
            });
        }

        return false;
    };

    /* -------------
      Collection View
      -------------- */

    // Whenever the collection view gets changed
    Deps.autorun(function () {
        var collection,
            currentView = Session.get('ognoAdminCurrentView');

        if (currentView && currentView.type && currentView.type.reference) {
            collection = getCollection();

            if (!_.isFunction(collection.simpleSchema)) {
                return;
            }
        }
    });

    // Helpers
    Template.ognoAdminCollectionsView.helpers({
        'entry' : function () {
            return getCollection().find({}, pagination.skip());
        },
        'pager' : function () {
            if (pagination.create) {
                return pagination.create(getCollection().find().count());
            }

            return '';
        },
        'hasMoreItems' : function () {
            return getCollection().find().count() > 10;
        },
        'isActive' : function () {
            return this._id === Session.get('selectedDocument') ? 'inverted teal active' : 'not-active';
        },
        'headerValue' : function () {
            var config = getConfig();
            return _.isObject(config) ? insertAt(_.keys(config), 0, '_id') : [];
        },
        'needsSchema' : function () {
            return _.isEmpty(OgnoAdmin.getSchema(getCollection()));
        },
        'value' : function (doc) {
            var array = [],
                config = getConfig();

            if (!config) {
                return array;
            }

            _.each(insertAt(_.keys(config), 0, '_id'), function (val) {
                array.push(printValue(doc[val], config[val]));
            });

            return array;
        }
    });

    // Created
    Template.ognoAdminMainView.created = function () {
        pagination = new Pagination("ognoAdminCollectionsPager");
    };

    // Events
    Template.ognoAdminMainView.events({
        'click .edit-document' : function (e) {
            Session.set('selectedDocument', $(e.target).attr('collection-id'));
            $('.page.dimmer').dimmer('show');
        },
        'click .add-document' : function () {
            Session.set('selectedDocument', 'new');
            $('.page.dimmer').dimmer('show');
        }
    });

    // Destroyed
    Template.ognoAdminMainView.destroyed = function() {
        pagination.destroy();
    };

    /* -------------
     Edit Form View
     -------------- */

    // Created
    Template.ognoAdminEditForm.created = function () {
        var config = OgnoAdmin.config();

        if ("string" === typeof config.filepicker && "object" === typeof filepicker) {
            filepicker.setKey(config.filepicker);
        }
    };

    AutoForm.addHooks('ognoAdminEditForm', {
        'onSubmit' : function (insertDoc, updateDoc, currentDoc) {
            var cb = function (err) {
                if (!err) {
                    $('.page.dimmer').dimmer('hide');
                }
            };

            insertDoc = getImageValues(insertDoc);

            if (currentDoc) {
                getCollection().update(currentDoc._id, { $set : insertDoc }, cb);
                return;
            }

            getCollection().insert(insertDoc, cb);

            this.resetForm();
            Session.set('selectedDocument', null);
            Session.set('uploadedDocument', null);
        }
    });

    // Rendered
    Template.ognoAdminEditForm.rendered = function () {
        var arrayInputs = $('select.arrayInput');

        // TODO: Why the ".$" attributes ?
        $('#ognoAdminEditForm .normalInput[name*=".$"]').parent().hide();

        if (_.isFunction(arrayInputs.select2)) {
            arrayInputs.select2({
                'width' : 200
            });
        }
    };

    // Helpers
    Template.ognoAdminEditForm.helpers({
        'editMode' : function () {
            return Session.get('selectedDocument');
        },
        'collectionForForm' : function () {
            return getCollection();
        },
        'selectedDoc' : function () {
            return getCollection().findOne(Session.get('selectedDocument'));
        },
        'formField' : function () {
            var schema = OgnoAdmin.getSchema(getCollection());

            if (_.isObject(schema)) {
                return _.map(schema, function (value, key) {
                    return {
                        'value' : value,
                        'field' : key,
                        'additionalClasses' : value.type === Array ? 'arrayInput' : 'normalInput'
                    };
                });
            }
        },
        'isNotNew' : function () {
            return Session.get('selectedDocument') !== 'new' || !Session.get('selectedDocument');
        },
        'operationClass' : function () {
            return Session.get('selectedDocument') !== 'new' ? 'update' : 'insert';
        },
        'operation' : function () {
            return Session.get('selectedDocument') !== 'new' ? 'Edit' : 'Create';
        },
        'removeClass': function () {
            return Session.get('reallyRemove') ? 'remove' : '';
        },
        'removeText' : function () {
            return Session.get('reallyRemove') ? 'Really remove' : 'remove';
        },
        'isImageField' : function () {
            if (this.value.regEx instanceof RegExp) {
                return this.value.regEx.toString() === SchemaRegEx.FilePickerImageUrl.toString();
            }
        },
        'imageUrl' : function (e) {
            return $('div[data-key="' + this.field + '"]').attr('data-url');
        },
        'dataUrl' : function () {
            var doc = {},
                id = Session.get('selectedDocument');

            if (_.isString(id)) {
                doc = getCollection().findOne(Session.get('selectedDocument'));
            }

            if (_.isObject(doc)) {
                return doc[this.field];
            }

            return '';
        }
    });

    // Events
    Template.ognoAdminEditForm.events({
        'click .removable' : function (e) {
            if (Session.equals('reallyRemove', true)) {
                getCollection().remove(Session.get('selectedDocument'));
                Session.set('reallyRemove', false);
                Session.set('selectedDocument', null);
                $('.page.dimmer').dimmer('hide');

                return;
            }

            Session.set('reallyRemove', true);
            e.preventDefault();
        },
        'click .image.button' : function (e) {
            filepicker.pick(function (blob) {
                var parent = $(e.target).parent();

                $(e.target).attr('data-url', blob.url);
                parent.find('.hidden.message').removeClass('hidden');
                parent.find('.imageUrl').html(blob.url);
            });
        },
        'submit #ognoAdminEditForm' : function (e) {
            e.preventDefault();
        },
        'click .close.dimmer' : function (e) {
            $('.page.dimmer').dimmer('hide');
        }
    });
})();
