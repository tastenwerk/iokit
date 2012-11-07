var auth = require( __dirname + '/../auth' );

var preferencesPlugin = {

  routes: function( app ){

    app.get('/preferences', auth.check, function( req, res ){
      res.format({

        html: function(){
          res.render( __dirname + '/views/index' );
        },

        js: function(){
          res.render( __dirname + '/views/index.ejs' );
        }

      });
    });

    app.get('/preferences/repair', auth.check, function( req, res ){
      req.user.settings = { common: { locale: 'de', hosts: ['a','b'] } };
      req.user.save( function( err ){
        if( err ) return res.send(err);
        res.json( res.locals.currentUser.settings );
      });
    })

    app.post('/preferences', function( req, res ){
    });

  }


}

module.exports = exports = preferencesPlugin;