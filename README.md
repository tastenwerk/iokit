# IOkit

IOkit is a frontend to expressjs providing you with a
management console and many widgets for a typical use
to organize and maintain your internet objects === web
pages, articles, contacts, events, ... anything you 
store and share and want to use from different places
in the internet.

## Features

Basically you will be using expressjs for the most of
your scripting and implementation work but there are 
quite some handsome tools provided by the internet
objects kit:

* beautiful web frontend
* tree structure for your JSON data-source (using knockoutjs)
* list structure
* properties (access control, version control, comments, ...)
* dashboard with widget system
* io-edit (jquery contenteditable html5 editor)
* io-tags (jquery tagging)
* notification system (using jquery.notice.)

## Installation

    npm install iokit

## Setting up your application

    iokit new <appname>

This will create a basic application structure very similar
to the one expressjs creates when using express' new command.

additionally, you will find a folder called 'config', 'models',
'middleware' and 'locales'. Each of them describes it's purpose
on it's own. Before starting your app you might want to double-check
the iokit.json file in the config directory.

It looks like this:

    {
      "hostname": "http://localhost:3000",
      "site": {
        "title": "myapp",
        "locales": ["de", "en"],
        "layouts": ["default", "front"],
        "support": "support@domain.com"
        },
        "session": {
          "timeout": {
            "mins": 30
          }
        },
        "datastore": {
          "absolutePath": "/path/to/my/app/datastore",
          "maxUploadSizeMB": 50,
          "resizeDefaultPX": 500
        },
        "userRoles": [user", "manager", "editor"],
        "port": 3000,
        "db": {
          "url": "mongodb://localhost:27017/myapp?auto_reconnect",
          "debug": true
        },
      "mailerSettings": {
          "host": "myhost.com",
          "port": 465,
          "auth": {
            "user": "automailer@domain.com",
            "pass": "xxxxxx"
          },
          "secureConnection": true
        },
      "mailerFrom": "automailer <automailer@domain.com>"
    }

### USING only parts of iokit

You can also use only parts of iokit by just requiring the desired components.
In your package.json


    {
      ...
      "dependencies": {
        "iokit": "git://github.com/tastenwerk/iokit.git",
      }
      ...
    }

In your app.js

    var ioauth = require('iokit/lib/plugins/auth');

    // ...

    app.configure(function(){


      // enable authentication routes (login/logout)
      ioauth.routes( app );

    }


Defining a route (either in app.js or in your routes.js file)

    var ioauth = require('iokit/lib/plugins/auth');

    app.get( '/secure', ioauth.check, function( req, res ){
      // this block will only pe processed if
      // ioauth.check was positive (means: session.user object exists)
      // otherwise, will redirect to '/login'
      if( req.session.valid )
        res.send('you are working secure')
      else
        res.redirect('/login');
    });

Overriding iomapper dependency in ioauth.check

    var ioauth = require('iokit/lib/plugins/auth');

    ioauth.checkWithoutRedirect = ioauth.check = function( req, res, next){
      if( !req.session.userId )
        return res.redirect('/login');
      next();
    }

    ioauth.tryLoginUser = function( req, res, next){
      if( req.body.username === 'myuser' && req.body.password === 'mypass' )
        req.session.valid = 'myidisnowvalid';
      next();
    });

### Further reading

to get more information about using iokit, you should visit the
ioweb plugin page on http://github.com/tastenwerk/ioweb
