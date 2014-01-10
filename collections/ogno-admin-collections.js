(function () {
    var pagination,
        documentForm;

    function getCollection() {
        var c = OgnoAdmin.getCollection(Session.get('ognoAdminCurrentView').type);
        return "object" === typeof c ? c : {};
    }

    function getConfig() {
        return Session.get('ognoAdminCurrentView').config;
    }

    function printValue(val, config) {
        if (!config) {
            return val;
        }

        return OgnoAdmin.typeFactory.get(config.type).printValue(val);
    }

    function getImageValues(doc) {
        $('.imageField .image.button').each(function () {
            var url = $(this).attr('data-url');

            if (_.isString(url) && url.length > 10) {
                doc[$(this).attr('data-key')] = $(this).attr('data-url');
            }
        });

        return doc;
    }

    function insertAt(array, index, item) {
        array.splice(index, 0, item);
        return array;
    }

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
        'editMode' : function () {
            return _.isString(Session.get('selectedDocument')) && Session.get('selectedDocument').length > 0;
        },
        'headerValue' : function () {
            var config = getConfig();
            return _.isObject(config) ? insertAt(_.keys(config), 0, '_id') : [];
        },
        'value' : function (doc) {
            var array = [],
                config = getConfig();

            _.each(insertAt(_.keys(config), 0, '_id'), function (val) {
                array.push(printValue(doc[val], config[val]));
            });

            return array;
        }
    });

    Template.ognoAdminMainView.created = function () {
        pagination = new Pagination("ognoAdminCollectionsPager");
    };

    Template.ognoAdminMainView.rendered = function () {
        sorttable.makeSortable(document.getElementById('collectionTable'));
    };

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

    Template.ognoAdminMainView.destroyed = function() {
        pagination.destroy();
    };

    Template.ognoAdminEditForm.created = function () {
        var config = OgnoAdmin.config();

        // Init autoform
        documentForm = new AutoForm(getCollection().simpleSchema());

        // Init filepicker if a key was given
        if ("string" === typeof config.filepicker) {
            filepicker.setKey(config.filepicker);
        }
    };

    Template.ognoAdminEditForm.rendered = function () {
        documentForm.hooks({
            'onSubmit' : function (insertDoc, updateDoc, currentDoc) {
                insertDoc = getImageValues(insertDoc);

                if (currentDoc) {
                    getCollection().update(currentDoc._id, { $set : insertDoc });
                    return;
                }

                getCollection().insert(insertDoc);

                this.resetForm();
                Session.set('selectedDocument', null);
                Session.set('uploadedDocument', null);
            }
        });
    };

    Template.ognoAdminEditForm.helpers({
        'documentForm' : function () {
            return documentForm;
        },
        'selectedDoc' : function () {
            return getCollection().findOne(Session.get('selectedDocument'));
        },
        'formField' : function () {
            var schema = getCollection().simpleSchema()._schema;

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
            $('.page.dimmer').dimmer('hide');
        }
    });
})();
