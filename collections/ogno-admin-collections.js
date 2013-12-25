Template.ognoAdminCollectionsView.helpers({
    'entry' : function () {
        return OgnoAdmin.getCollectionBySession(Session.get('currentCollection').type).find();
    },
    'print' : function (doc) {
        console.log(doc);
    }
});