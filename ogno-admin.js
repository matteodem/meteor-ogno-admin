OgnoAdmin = (function () {
    var structure = [{ 'menu-title' : 'Dashboard', 'icon' : 'dashboard', 'slug' : '', 'weight' : '1' }],
        collections = {},
        config = {
            'prefix' : '/ogno-admin',
            'isAllowed' : function () {
                return Meteor.user();
            }
        };

    function slugify(Text)
    {
        return Text.toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'');
    }

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
                    sessionConfig[key] = _.extend(_.clone(value), {
                        type : value.type.toString().match(/[A-Z][\w]+()/g).shift().toLowerCase()
                    });
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

    function getStructureWithParameters(p) {
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
                            s = getStructureWithParameters(this.params);

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

        // TODO:
        // TODO: Images, filepicker
        // TODO: Arrays, select2
    }

    return {
        'config' : function (c) {
            if ("undefined" === typeof c) {
                return config;
            }

            config = _.extend(config, c);
            init();
        },
        'structure' : function (s) {
            if ("undefined" === typeof s) {
                return structure;
            }

            structure = setUpStructure(s, true);
        },
        'isAllowed' : function () {
            return config.isAllowed();
        },
        'getCollection' : function (p) {
            return collections[p.reference] ? collections[p.reference] : {};
        }
    };
})();
