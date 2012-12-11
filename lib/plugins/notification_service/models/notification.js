/**
 * the Notification Model
 * stores any kind of notification for users
 *
 */

var konter = require('konter');

var NotificationSchema = konter.mongoose.Schema({
  acl: {type: konter.mongoose.Schema.Types.Mixed, default: {}, index: true},
  _creator: {type: konter.mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: {type: Array, default: [] },
  message: {type: String, required: true },
  createdAt: {type: Date, default: Date.now},
  type: {type: String, default: 'System Notification'}
});

/**
 * before create check that
 * creator will have access on this object
 */
NotificationSchema.pre('save', function( next ){
  if( this.isNew ){
    this.acl[this._creator.toString()] = { privileges: 'rwsd' };
    this.read.push( this._creator.toString() );
  }
  next();
});

var Notification = konter.mongoose.model( 'Notification', NotificationSchema );

module.exports = exports = Notification;
