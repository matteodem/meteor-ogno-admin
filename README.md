Ogno-Admin
=================

This package creates an Admin UI with a menu structure and configuration through the ``OgnoAdmin`` API.
It validates itself with the [simple-schema](https://github.com/aldeed/meteor-simple-schema) package and generates
the create / edit forms with [autoform](https://github.com/aldeed/meteor-autoform). Routes are created with
[iron-router](https://github.com/EventedMind/iron-router) and the html, css is enhanced with
[semantic-ui](https://github.com/nooitaf/meteor-semantic-ui).

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

The ``auto`` property will search your global window scope and create a basic menu structures with all your
Meteor.Collection and Meteor.Collection2's in it. Only a user with the username "admin" will be allowed to see the
Admin UI, configured with the ``isAllowed`` property.

The API is always useable on the client and server.

## How to install

```bash
mrt add ogno-admin
```

## Enhance UI with Structure

You can enhance the menu structure for your Admin UI with your own menu views, by using the API.

```javascript
Meteor.startup(function () {
    OgnoAdmin.structure({
        'weight'     : 5,
        'type'       : 'no-link',
        'icon'       : 'archive',
        'menu-title' : 'Collections',
        'tree'   : [
            {
                'type' : 'collection',
                'use'  : (instanceof Meteor.Collection2),
                'menu-title' : 'Some Collection'
            },
            {
                'type' : 'custom',
                'use'  : 'templateString',
                'menu-title' : 'Some custom view'
            },
            {...}
        ]
    });
});
```

It's also possible to use an array as the first parameter. It doesn't replace the existing menu structure but extends it,
so you can have multiple structure() calls in your code.

The ``tree`` is only useable on the root menu elements.


## Possible configurations

You can configurate quite some options, but you don't have to (Client and Server):
```javascript
OgnoAdmin.config({
    auto                : Boolean,  // default: false,
    filepicker          : String,   // default: ''
    homeScreenTemplate  : String,   // default: 'ognoAdminOverview'
    isAllowed           : Function, // default: return Meteor.user()
    prefix              : String    // default: '/ogno-admin'
});
```
