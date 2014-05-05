OgnoAdmin = (function () {
    var structure = [{ 'menu-title' : 'Dashboard', 'icon' : 'dashboard', 'slug' : '', 'weight' : '1' }],
        collections = {},
        jsTypes = {
            'string' : String,
            'number' : Number,
            'object' : Object,
            'boolean' : Boolean
        },
        config = {
            'prefix' : '/ogno-admin',
            'isAllowed' : function () {
                return Meteor.user();
            }
        };

    /**
     * Returns a slugified text, for links.
     *
     * @param {String} text
     * @returns {String}
     */
    function slugify(text)
    {
        return text.toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'');
    }

    /**
     * Returns a string more human readable, by prettifying it.
     */
    function prettify(string) {
        string = string.replace(/[-_]+/g, ' ');
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
    }

    /**
     * Return a Meteor.Collection instance, enhanced with a simpleSchema() method.
     *
     * @param {Object} config
     * @returns {Object}
     */
    function addSimpleSchemaToCollection(collection, schema) {
        // if no schema provided
        if (_.isUndefined(schema)) {
            schema = fakeSimpleSchema(collection.findOne());
        }

        // Add a simple schema to the collection if has function
        if (_.isFunction(collection.attachSchema)) {
            collection.attachSchema(new SimpleSchema(schema));
            return collection;
        }

        collection.simpleSchema = function () {
            return new SimpleSchema(schema);
        };

        return collection;
    }

    /**
     * Return simple schema object configuration, configured with a mongo doc.
     *
     * @param {Object} doc
     * @returns {Object}
     */
    function fakeSimpleSchema(doc) {
        var conf;

        if (_.isObject(doc)) {
            conf = {};

            delete doc._id;

            _.each(doc, function (value, key) {
                var type = _.isArray(value) ? Array : jsTypes[typeof value];

                if (!type) {
                    return;
                }

                conf[key] = {
                    'type' : type,
                    'optional' : !value
                };
            });
        }

        return conf;
    }

    /**
     * Returns an ogno-admin readable config object of a simple schema.
     *
     * @param {Object} schema
     * @return {Object}
     */
    function getOgnoAdminConfigFromSchema(schema) {
        var config = {};

        _.each(schema, function (value, key) {
            var fieldName,
                collectionName;

            if (key.indexOf('.$') > -1) {
                return;
            }

            if (_.isObject(value.ognoAdmin) && _.isObject(value.ognoAdmin.references)) {
                collectionName = value.ognoAdmin.references._name;
                fieldName = value.ognoAdmin.field ? value.ognoAdmin.field : '_id';
            }

            config[key] = {
                type : value.type.toString().match(/[A-Z][\w]+()/g).shift().toLowerCase(),
                references : collectionName,
                field : fieldName
            };
        });

        return config;
    }
    /**
     * Returns a fully converted structure, useable by ogno-admin.
     *
     * @param {Object}  s       the new Structure
     * @param {Boolean} isRoot  True if its firstly called (not nested).
     * @returns {Array}
     */
    function setUpStructure(s, isRoot) {
        s = _.isArray(s) ? s : [s];

        var fullStructure = _.map(s, function (e) {
            var schema,
                collection,
                sessionConfig = {};

            if (e.tree && isRoot) {
                // is a sub menu tree
                e.type = setUpStructure(e.tree);
            }

            if ("collection" === e.type) {
                // is a collection view
                if (_.isObject(e.use) && e.use.collection) {
                    collection = e.use.collection;
                } else {
                    collection = e.use;
                }

                if (_.isObject(e.use) && e.use.schema) {
                    schema = e.use.schema;
                }

                // if not a collection 2 view, add a simpleSchema() method
                if (!_.isFunction(collection.simpleSchema) || !collection.simpleSchema()) {
                    collection = addSimpleSchemaToCollection(collection, schema);
                }

                collections[collection._name] = collection;
                e.type = { 'view' : 'collections', 'reference' : collection._name };

                e.config = getOgnoAdminConfigFromSchema(
                  collection.simpleSchema()._schema
                );
            } else if ("custom" === e.type) {
                // is a custom template
                e.type = { 'view' : e.use };
            }

            delete e.use;

            return _.extend(e, { 'slug' : slugify(e['menu-title']) });
        });

        if (isRoot) {
            fullStructure = _.sortBy(
                // unite the structure before with the new one
                _.union(structure, fullStructure),
                // sort by defined weight
                function(doc) {
                    return doc.weight
                }
            );
        }

        if (Meteor.isClient) {
            Session.set('ognoStructure', fullStructure);
        }

        return fullStructure;
    }

    /**
     * Returns a part / sector of the structure with iron-router data parameters.
     *
     * @param {Object} p
     * @returns {Object}
     */
    function getSectorOfStructureWithParameters(p) {
        var s = structure;

        if (p.pid) {
            s = _.find(structure, function (s) {
                return p.pid === s.slug;
            }).type;
        }

        s = _.find(s, function (s) {
            return p.id === s.slug;
        });

        return s;
    }

    /**
     * Single time initializion, for ogno-admin, with the configuration.
     *
     * Uses the config object for:
     *  'prefix' : '/admin'                         // Change the prefixing for the admin UI
     *  'homeScreenTemplate' : 'adminHomeScreen'    // The template name for dashboard
     */
    function init() {
        var globalCollections;

        Router.map(function () {
            var routerConfig = function (path, o) {
                var defaultConf = {
                    'layoutTemplate' : 'ognoAdminLayout',
                    'template' : 'ognoAdminMainView',
                    'path' : config.prefix + path,
                    'onRun' : function () {
                        Session.set('selectedDocument', null);
                        Session.set('ognoAdminCurrentView', null);
                    },
                    'data' : function () {
                        var data = {},
                            s = getSectorOfStructureWithParameters(this.params);

                        if (s && _.isObject(s.type)) {
                            Session.set('ognoAdminCurrentView', s);
                            Session.set('viewParams', this.params);
                        }

                        return data;
                    }
                };

                return _.extend(defaultConf, o);
            };

            this.route('ognoAdminIndex', routerConfig('', { 'template' : 'ognoAdminOverview' }));
            this.route('ognoAdminMainPage', routerConfig('/:id'));
            this.route('ognoAdminSubPage', routerConfig('/:pid/:id'));
        });

        if (!Meteor.isClient) {
            return;
        }

        Handlebars.registerHelper('canView', function () {
            return OgnoAdmin.isAllowed();
        });

        Template.ognoAdminOverview.helpers({
            'customizedHomeScreen' : function () {
                return config.homeScreenTemplate;
            },
            'customHomeScreenContent' : function () {
                return Template[config.homeScreenTemplate];
            },
            'customizedGuestHomeScreen' : function () {
                return config.homeScreenTemplateGuest;
            },
            'customGuestHomeScreenContent' : function () {
                return Template[config.homeScreenTemplateGuest];
            }
        });

        if (config.auto) {
            Meteor.startup(function () {
                globalCollections = [];

                for (collection in window) if (window.hasOwnProperty(collection)
                    // Check if its an instance of Meteor.Collection or Meteor.Collection2
                    && (window[collection] instanceof Meteor.Collection
                    || window[collection] instanceof Meteor.Collection2)) {
                    globalCollections.push({
                        'type' : 'collection',
                        'use'  : window[collection],
                        'menu-title' : prettify(window[collection]._name),
                        'site-title' : "Manage " + window[collection]._name
                    });
                }

                structure = setUpStructure({
                    'weight' : 5,
                    'type'   : 'no-link',
                    'icon'   : 'archive',
                    'tree'   : globalCollections,
                    'menu-title' : 'Collections'
                }, true);
            });
        }
    }

    // Custom FilePicker RegEx, enhancing Simple-Schema
    SchemaRegEx.FilePickerImageUrl = /(https?:\/\/www.filepicker.io\/api\/file\/[\w]+)/i;

    // Custom property called "ognoAdmin"
    SimpleSchema.extendOptions({
        'ognoAdmin' : Match.Optional(Object)
    });

    // Public API
    return {
        /**
         * Initialize ogno-admin (Server and Client side).
         *
         * @param {Object} c
         * @returns {Object} Current configuration
         */
        'config' : function (c) {
            if ("undefined" === typeof c) {
                return config;
            }

            config = _.extend(config, c);
            init();
        },
        /**
         * The structure for the admin ui.
         *
         * @param {Array} s
         * @returns {Array}
         */
        'structure' : function (s) {
            if ("undefined" === typeof s) {
                return structure;
            }

            structure = setUpStructure(s, true);
        },
        /**
         * Return true if people can view the admin interface, is configurable.
         *
         * @returns {Boolean}
         */
        'isAllowed' : function () {
            return config.isAllowed();
        },
        /**
         * Returns the collection with the _name attrbute of the collection provided.
         *
         * @param {String} p
         * @returns {Object}
         */
        'getCollection' : function (p) {
            return collections[p] ? collections[p] : {};
        },
        /**
         * Returns a simple schema to a specified collection.
         *
         * @param {Object} c
         * @returns Object
         */
        'getSchema' : function (c) {
            var schema = [],
                schemaObj = c.simpleSchema();

            if (!_.isObject(schemaObj)) {
                return schema;
            }

            schema = schemaObj._schema;

            if (_.size(schema) === 0) {
                return fakeSimpleSchema(c.findOne());
            }

            return schema;
        },
        /**
         * Helpers object to test them.
         */
        '_helpers' : {
            'slugify' : slugify,
            'prettify' : prettify,
            'fakeSimpleSchema' : fakeSimpleSchema,
            'getOgnoAdminConfigFromSchema' : getOgnoAdminConfigFromSchema
        }
    };
})();
