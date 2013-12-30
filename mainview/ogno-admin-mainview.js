Template.ognoAdminMainView.helpers({
    'isCollectionView' : function () {
        return Session.get('currentCollection');
    },
    'canView' : function () {
        return OgnoAdmin.isAllowed();
    }
});