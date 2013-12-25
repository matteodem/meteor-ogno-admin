Package.describe({
  summary: "Easy to use / extendable admin UI"
});

Package.on_use(function (api, where) {
    api.add_files('ogno-admin.js', ['client', 'server']);

    // Main views
    api.add_files(
        ['views/ogno-admin-layout.html', 'views/ogno-admin-overview.html', 'views/ogno-admin-mainview.html'],
        'client'
    );

    // Collection view
    api.add_files(
        ['collections/ogno-admin-collections.html', 'collections/ogno-admin-collections.js'],
        'client'
    );

    // Menu view
    api.add_files(['menu/menu.html', 'menu/menu.js'], 'client');

    // Styles
    api.add_files('main.less', 'client');

    api.use(
        ['less', 'underscore', 'accounts-base', 'templating', 'livedata', 'mongo-livedata', 'jquery',
            'iron-router', 'semantic-ui', 'session']
    );

    api.export('OgnoAdmin');
});
