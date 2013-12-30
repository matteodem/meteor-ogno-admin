Template.ognoAdminMainView.helpers({
    'isCollectionView' : function () {
        var view = Session.get('ognoAdminCurrentView');
        return view.type.view === "collections";
    },
    'canView' : function () {
        return OgnoAdmin.isAllowed();
    },
    'siteTitle' : function () {
        return Session.get('ognoAdminCurrentView').title;
    },
    'customTemplateContents' : function () {
        var view = Session.get('ognoAdminCurrentView');

        if (!_.isString(view.type.view)) {
            return '';
        }

        if ("undefined" === typeof Template[view.type.view]) {
            return '<h1 class="ui large red inverted header">Didn\'t find your template specified: ' + view.type.view + '</h1>';
        }

        return Template[view.type.view]();
    }
});