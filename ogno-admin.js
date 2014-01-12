OgnoAdmin = (function () {
    var structure = [{ 'menu-title' : 'Dashboard', 'icon' : 'dashboard', 'slug' : '', 'weight' : '1' }],
        collections = {},
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
     * Returns a fully converted structure, useable by ogno-admin.
     *
     * @param {Object}  s       the new Structure
     * @param {Boolean} isRoot  True if its firstly called (not nested).
     * @returns {Array}
     */
    function setUpStructure(s, isRoot) {
        var fullStructure = _.map(s, function (e) {
            var collection;

            if ("tree" === e.type) {
                // is a sub menu tree
                e.type = setUpStructure(e.use);
            } else if ("collection" === e.type) {
                var sessionConfig = {};

                // is a collection view
                collections[e.use._name] = collection = e.use;
                e.type = { 'view' : 'collections', 'reference' :  e.use._name };

                _.each(collection.simpleSchema()._schema, function (value, key) {
                    var fieldName,
                        collectionName;

                    if (key.indexOf('.$') > -1) {
                        return;
                    }

                    if (_.isObject(value.ognoAdmin) && _.isObject(value.ognoAdmin.references)) {
                        collectionName = value.ognoAdmin.references._name;
                        fieldName = value.ognoAdmin.field ? value.ognoAdmin.field : '_id';
                    }

                    sessionConfig[key] = {
                        type : value.type.toString().match(/[A-Z][\w]+()/g).shift().toLowerCase(),
                        references : collectionName,
                        field : fieldName
                    };
                });

                e.config = sessionConfig;
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
        Router.map(function () {
            var routerConfig = function (path, o) {
                var defaultConf = {
                    'layoutTemplate' : 'ognoAdminLayout',
                    'template' : 'ognoAdminMainView',
                    'path' : config.prefix + path,
                    'load' : function () {
                        Session.set('selectedDocument', null);
                        Session.set('ognoAdminCurrentView', null);
                    },
                    'data' : function () {
                        var data = {},
                            s = getSectorOfStructureWithParameters(this.params);

                        if (s && _.isObject(s.type)) {
                            Session.set('ognoAdminCurrentView', s);
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

        if (Meteor.isClient) {
            Handlebars.registerHelper('canView', function () {
                return OgnoAdmin.isAllowed();
            });

            Template.ognoAdminOverview.helpers({
                'customizedHomeScreen' : function () {
                    return config.homeScreenTemplate;
                },
                'customHomeScreenContent' : function () {
                    return Template[config.homeScreenTemplate]();
                }
            });
        }

        // TODO: README.md (how to images!)
        // TODO: Why type.$ ?
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
        }
    };
})();
