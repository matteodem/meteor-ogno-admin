Template.ognoAdminMainView.helpers({
    'isCollectionView' : function () {
        return Session.get('currentCollection');
    }
});