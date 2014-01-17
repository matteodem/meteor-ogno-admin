Ogno-Admin
=================

This package creates an Admin UI with a menu structure and configuration through the ``OgnoAdmin`` API.
It validates itself with the [simple-schema](https://github.com/aldeed/meteor-simple-schema) package and generates
the create / edit forms with [autoform](https://github.com/aldeed/meteor-autoform).

## Quick Intro
```javascript
// Client and Server

OgnoAdmin.config({
    auto : true,
    isAllowed : function () {
        var user = Meteor.user();

        if (user) {
            return 'admin' === user.username;
        }
    }
});
```

The ``auto`` property will search your global window scope and create a basic menu structures with all your collections in
it. Only a user with the username "admin" will be allowed to see your Admin UI, with the ``isAllowed`` property.

## How to install

```bash
mrt add ogno-admin
```

## Possible configurations

You can configurate quite some options, but you don't have to:
```javascript
// Client and Server

OgnoAdmin.config({
    auto                : Boolean,  // default: false,
    filepicker          : String,   // default: ''
    homeScreenTemplate  : String,   // default: 'ognoAdminOverview'
    isAllowed           : Function, // default: return Meteor.user()
    prefix              : String    // default: '/ogno-admin'
});
```
