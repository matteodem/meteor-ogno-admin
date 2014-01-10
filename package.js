Package.describe({
  summary: "Easy to use / extendable admin UI"
});

Package.on_use(function (api, where) {
    api.add_files('ogno-admin.js', ['client', 'server']);

    // Overview + layout
    api.add_files(['views/ogno-admin-layout.html', 'views/ogno-admin-overview.html'], 'client');

    // Main view
    api.add_files(['mainview/ogno-admin-mainview.html', 'mainview/ogno-admin-mainview.js'], 'client');

    // Collection view
    api.add_files(
        ['collections/ogno-admin-collections.html', 'collections/ogno-admin-collections.js',
            'collections/ogno-admin-collections.less', 'collections/ogno-admin-types.js',
            'lib/jquery.tablesorter.min.js'],
        'client'
    );

    // Menu view
    api.add_files(['menu/menu.html', 'menu/menu.js'], 'client');

    // Styles
    api.add_files('main.less', 'client');

    api.use(
        ['less', 'underscore', 'accounts-base', 'templating', 'livedata', 'mongo-livedata', 'jquery', 'filepicker',
            'iron-router', 'semantic-ui', 'session', 'pagination-mini', 'autoform', 'simple-schema', 'handlebars']
    );

    api.export('OgnoAdmin');
});
