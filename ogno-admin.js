OgnoAdmin = (function () {
    var structure = [{ 'title' : 'Dashboard', 'icon' : 'dashboard', 'slug' : '' }],
        collections = {},
        config = { 'prefix' : '/ogno-admin'};

    function slugify(Text)
    {
        return Text.toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'');
    }

    function setUpStructure(s, isRoot) {
        var fullStructure = _.map(s, function (e) {
            if (_.isArray(e.type)) {
                e.type = setUpStructure(e.type);
            } else if (e.type instanceof Meteor.Collection) {
                // type identifier
                collections[e.type._name] = e.type;
                e.type = { 'view' : 'collections', 'reference' :  e.type._name };
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

    Router.map(function () {
        var routerConfig = function (path, o) {
            return _.extend({
                'layoutTemplate' : 'ognoAdminLayout',
                'template' : 'ognoAdminMainView',
                'path' : config.prefix + path,
                'data' : function () {
                    var data = {},
                        s = getStructureWithParameters(this.params);

                    if (s && _.isObject(s.type) && "collections" === s.type.view) {
                        Session.set('currentCollection', s);
                        data['content'] = Template['ognoAdminCollectionsView']();
                    }

                    return data;
                }
            }, o);
        };

        this.route('ognoAdminIndex', routerConfig('', { 'template' : 'ognoAdminOverview' })); // TODO: Make template / text possible for structure
        this.route('ognoAdminMainPage', routerConfig('/:id'));
        this.route('ognoAdminSubPage', routerConfig('/:pid/:id'));
    });

    // TODO: collection view
    // TODO: Permissions with meteor roles
    // TODO: make zero configurations possible with top level collections

    return {
        'config' : function (c) {
            if ("undefined" === typeof c) {
                return config;
            }

            config = _.extend(config, c);
        },
        'structure' : function (s) {
            if ("undefined" === typeof s) {
                return structure;
            }

            structure = setUpStructure(s, true);
        },
        'getCollectionBySession' : function (p) {
            return collections[p.reference] ? collections[p.reference] : {};
        }
    };
})();