(function () {
    var pagination;

    function getCollection() {
        var c = OgnoAdmin.getCollection(Session.get('currentCollection').type);
        return "object" === typeof c ? c : {};
    }

    function getConfig() {
        return Session.get('currentCollection').config;
    }

    function printValue(val, config) {
        if (!config) {
            return val;
        }

        return OgnoAdmin.typeFactory.get(config.type).printValue(val);
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
            return _.isObject(getCollection().findOne()) ? _.keys(getCollection().findOne()) : [];
        },
        'value' : function (doc) {
            var array = [],
                config = getConfig();

            _.each(_.keys(getCollection().findOne()), function (val) {
                array.push(printValue(doc[val], config[val]));
            });

            return array;
        }
    });

    Template.ognoAdminMainView.created = function () {
        pagination = new Pagination("ognoAdminCollectionsPager");
    };

    Template.ognoAdminMainView.events({
        'click .edit-document' : function (e) {
            Session.set('selectedDocument', $(e.target).attr('collection-id'));
        },
        'click .add-document' : function () {
            Session.set('selectedDocument', 'new');
        }
    });

    Template.ognoAdminMainView.destroyed = function(){
        pagination.destroy();
    };

    Template.ognoAdminEditForm.helpers({
        'formField' : function () {
            var config = getConfig();

            return _.map(_.keys(config), function (key) {
                return _.extend(config[key], { 'key' : key });
            });
        },
        'inputType' : function () {
            return OgnoAdmin.typeFactory.get(this.type).inputType;
        },
        'inputAttributes' : function () {
            var attributes = "",
                doc = getCollection().findOne(Session.get('selectedDocument'));

            if (!_.isObject(doc)) {
                return '';
            }

            if (this.required) {
                attributes += ' required="required" ';
            }

            attributes += OgnoAdmin.typeFactory.get(this.type).getInputValue(doc[this.key]);

            return attributes;
        },
        'isNotNew' : function () {
            return Session.get('selectedDocument') !== 'new';
        },
        'removeText' : function () {
            return Session.get('reallyRemove') ? 'Really remove' : 'remove';
        }
    });

    Template.ognoAdminEditForm.events({
        'click .remove' : function () {
            if (Session.equals('reallyRemove', true)) {
                getCollection().remove(Session.get('selectedDocument'));
                Session.set('reallyRemove', false);
                Session.set('selectedDocument', null);

                return;
            }

            Session.set('reallyRemove', true);
        },
        'click .ogno-admin .cancel' : function () {
            $('.really-remove.modal').modal('hide');
        },
        'click .save' : function () {
            var values = {},
                collection = getCollection(),
                config = getConfig(),
                configKeys = _.keys(config);

            $('#ognoAdminEditForm input').each(function (i) {
                var type = config[configKeys[i]].type;
                values[configKeys[i]] = OgnoAdmin.typeFactory.get(type).getDocumentValue($(this));
            });

            if (_.isFunction(collection.easyInsert)) {
                collection.easyInsert(values);
            } else {
                collection.insert(values);
            }

            Session.set('selectedDocument', null);
        },
        'blur #ognoAdminEditForm input, click #ognoAdminEditForm input[type="checkbox"]' : function (e) {
            var newValue = OgnoAdmin.typeFactory.get(this.type).getDocumentValue($(e.target)),
                collection = getCollection(),
                updatedPartialDoc = {};

            updatedPartialDoc[this.key] = newValue;

            if (_.isFunction(collection.easyUpdate)) {
                collection.easyUpdate(Session.get('selectedDocument'), { '$set' : updatedPartialDoc });
                return;
            }

            collection.update(Session.get('selectedDocument'), { '$set' : updatedPartialDoc });
        }
    });
})();
