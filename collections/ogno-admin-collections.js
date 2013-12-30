(function () {
    var pagination;

    function getCollection() {
        var c = OgnoAdmin.getCollectionBySession(Session.get('currentCollection').type);
        return "object" === typeof c ? c : {};
    }

    function printValue(val, config) {
        var jsonString;

        if (config) {
            // do config stuff
        }

        // TODO: Remove this if
        if (_.isString(val)) {
            return val;
        }

        jsonString = JSON.stringify(val);

        if (_.isString(jsonString) && jsonString.length > 20) {
            return jsonString.slice(0, 20) + '...';
        }

        return jsonString;
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
                collection = getCollection();

            _.each(_.keys(getCollection().findOne()), function (val) {
                array.push(printValue(doc[val], collection._config));
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
            var config = getCollection()._config;

            return _.map(_.keys(config), function (key) {
                return _.extend(config[key], { 'key' : key });
            });
        },
        'inputType' : function () {
            var type = "";

            switch (this.type) {
                default:
                    type = 'text';
                    break;
            }

            return type;
        },
        'inputValue' : function () {
            var value,
                doc = getCollection().findOne(Session.get('selectedDocument'));

            if (!_.isObject(doc)) {
                return '';
            }

            value = doc[this.key];

            if (_.isString(value)) {
                return value;
            }

            return JSON.stringify(value);
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
                configKeys = _.keys(getCollection()._config);

            $('#ognoAdminEditForm input').each(function (i) {
                values[configKeys[i]] = $(this).val();
            });

            getCollection().insert(values);
            Session.set('selectedDocument', null);
        },
        'blur #ognoAdminEditForm input' : function (e) {
            var newValue = {},
                formValue = $(e.target).val();

            try {
                newValue[this.key] = JSON.parse(formValue);
            } catch (e) {
                newValue[this.key] = formValue;
            }

            getCollection().update(Session.get('selectedDocument'), { $set : newValue });
        }
    });
})();
