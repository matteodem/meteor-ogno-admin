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

You can enhance the menu structure for your Admin UI with your own views, by using the API.

```javascript
Meteor.startup(function () {
    OgnoAdmin.structure({
        'weight'     : 5,
        'type'       : 'no-link',
        'icon'       : 'archive',
        'menu-title' : 'Collections',
        'tree'   : [
            {
                // Type is a collection view, which creates a view with
                // all CRUD operations handled
                'type' : 'collection',
                'use'  : (instanceof Meteor.Collection2 || Meteor.Collection),
                'menu-title' : 'Some Collection'
            },
            {
                // Type is a custom view, which will render a custom template
                // it is accessed through Template[templateString]
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

The ``tree`` is only useable on the root menu elements. Use weight to define the order of the menu elements.

## Possible properties for views
```javascript
Meteor.startup(function () {
    OgnoAdmin.structure({
        'menu-title'    : String,  // Menu title (required)
        'type'          : String,  // View type, currently "collection" or "custom" (required)
        'use'           : 'Mixed', // Additional information for "type", variates (required)
        'tree'          : Array,   // Define sub elements, only possible on root
        'weight'        : Number,  // Sort order for all menu elements / views
        'slug'          : String,  // Custom url slug, gets auto-defined if none
        'icon'          : String,  // http://semantic-ui.com/elements/icon.html
        'site-title'    : String   // Custom site title, gets auto-defined if none
    });
});
```

## View types
## Collection
To get a basic CRUD view for a specified collection define one of your elements like following.
```javascript
Meteor.startup(function () {
    OgnoAdmin.structure({
        'menu-title'    : 'Cars',
        'type'          : 'collection',
        'use'           : instanceof Meteor.Collection2
    });

    // or

    OgnoAdmin.structure({
        'menu-title'    : 'Cars 2',
        'type'          : 'collection',
        'use'           : {
            'schema'    : {
                ... /* Simple Schema */
            },
            'collection' : instanceof Meteor.Collection
        }
    });

    // or, but is currently flaky

    OgnoAdmin.structure({
        'menu-title'    : 'Cars 3',
        'type'          : 'collection',
        'use'           : instanceof Meteor.Collection
    });
});
```

## Custom

To render a custom Meteor template, use as followed.
```html
<template name="customTemplate">
...
</template>
```
And the javascript looks like:
```javascript
Meteor.startup(function () {
    OgnoAdmin.structure({
        'menu-title'    : 'Custom view',
        'type'          : 'custom',
        'use'           : 'customTemplate'
    });
});
```

## Using images

You can add an API key to the property ``filepicker`` in your configuration and use the meteor package "filepicker",
to handle images in your collections.

To actually define an "image" field, use a custom definition in your Collection2 simple schema. 

```javascript
...
'image' : {
    'type' : String,
    'regEx' : SchemaRegEx.FilePickerImageUrl // the RegEx defined here defines the image field
}
...
```

All your images are handled through the collection view and the uploading by the filepicker service.

## Configuration

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


## Examples
This project uses the ogno-admin for demonstration purposes https://github.com/matteodem/meteor-ogno-admin-example.
