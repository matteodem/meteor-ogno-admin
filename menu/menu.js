Template.ognoAdminMenu.helpers({
    'mainItem' : function () {
        return Session.get('ognoStructure');
    },
    'isActive' : function () {
        this.slug = "string" === typeof this.path ? this.path.slice(1) : this.slug;
        // Later, check also for pid if isSub Item!
        return this.slug === Router.current().params.id ? 'active' : 'not-active';
    },
    'tag' : function () {
        return this['no-link'] || _.isArray(this.type) ? 'div' : 'a';
    },
    'url' : function () {
        return Router.routes['ognoAdminMainPage'].path({ 'id' : this.slug });
    },
    'subItem' : function () {
        var that = this;
        return _.isArray(this.type) ? _.map(this.type, function (t) { return _.extend(t, { 'parent' : that.slug }); }) : [];
    },
    'subUrl' : function () {
        return Router.routes['ognoAdminSubPage'].path({ 'id' : this.slug, 'pid' : this.parent });
    },
    'canView' : function () {
        return OgnoAdmin.isAllowed();
    }
});
