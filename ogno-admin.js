OgnoAdmin = (function () {
    var structure = [{ 'title' : 'Dashboard', 'icon' : 'dashboard', 'slug' : '' }],
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

            if (_.isArray(e.type)) {
                // is a sub menu tree
                e.type = setUpStructure(e.type);
            } else if (e.type instanceof Meteor.Collection) {
                // is a collection view
                collections[e.type._name] = collection = e.type;
                e.type = { 'view' : 'collections', 'reference' :  e.type._name };
                e.config = _.isObject(collection._config) ? collection._config : e.config;
            }

            return _.extend(e, { 'slug' : slugify(e.title) });
        });

        if (isRoot) {
            // unite the structure before with the new one
            fullStructure = _.union(structure, fullStructure);
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
                        Session.set('currentCollection', null);
                    },
                    'data' : function () {
                        var data = {},
                            s = getStructureWithParameters(this.params);

                        if (s && _.isObject(s.type) && "collections" === s.type.view) {
                            Session.set('currentCollection', s);
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
        }

        // TODO: instead of using collection._config, make a helper for getting the structure config!
        // TODO: Make config property on structure possible with EasyCheck Objects
        // TODO: Use EasyCheck.helpers.getEasyCheckConfig()
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
        'getCollectionBySession' : function (p) {
            return collections[p.reference] ? collections[p.reference] : {};
        }
    };
})();
