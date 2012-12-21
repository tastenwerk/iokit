var nodemailer = require("nodemailer")
  , fs = require('fs')
  , version = require( __dirname + '/version' )
  , config = JSON.parse( fs.readFileSync( process.cwd() + '/config/inter.json' ) );

function deliver( options, callback ){
  var smtpTransport = nodemailer.createTransport("SMTP", config.mailerSettings );

  var mailOptions = {
      from: inter.config.mailerFrom,
      to: options.to,
      subject: options.subject,
      headers: {
        'X-Mailer': 'INTER sendmail (by TASTENWERK) v'+version
      }
  }
  if( options.html )
    mailOptions.html = options.html;
  if( options.text )
    mailOptions.text = options.text;
  else
    mailOptions.generateTextFromHTML = true;
  if( options.bcc )
    mailOptions.bcc = options.bcc;

  smtpTransport.sendMail(mailOptions, function(err, response){
      smtpTransport.close();
      callback( err, response );
  });
}

module.exports = exports = { deliver: deliver };