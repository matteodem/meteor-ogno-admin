Template.ognoAdminMenu.helpers({
    'mainItem' : function () {
        return Session.get('ognoStructure');
    },
    'isActive' : function (parent) {
        var isActive,
            parentIsActive = true,
            currentParams = Router.current().params;

        this.slug = "string" === typeof this.path ? this.path.slice(1) : this.slug;

        // always check pid
        isActive = this.slug === currentParams.id;

        // If there's a parent slug and also current parameters have it
        if (parent.slug && currentParams.pid) {
            parentIsActive = currentParams.pid === parent.slug;
        } else if (currentParams.pid) {
            // if there's no parent on current menu entry
            // but the current parameters have one
            parentIsActive = false;
        }

        return isActive && parentIsActive ? 'active' : 'not-active';
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
