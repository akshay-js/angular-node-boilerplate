const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const _        = require('lodash');
const bcrypt   = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  id: {type: String,required: false},
  ful_name: {type: String,required: false},
  email: {type: String,required: false},
  password: {type: String,required: false},
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});


UserSchema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();
    return _.pick(userObject, ['_id','full_name','email']);
  
};

UserSchema.methods.generateAuthToken = function (req,res) {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({
    _id: user._id.toHexString(),
    iat:Math.floor(Date.now() / 1000) + (60*60*24*300)
  }, process.env.JWT_SECRET).toString();

  user.tokens = ({access, token});
  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function (token) {
  var user = this;
  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};


UserSchema.statics.findUserByEmail = function (email) {
  var User = this;
  return User.findOne({'is_deleted':0, "email" : { $regex : new RegExp(email, "i") } }).then((user) => {
    return user;
  });
};

UserSchema.statics.findByCredentials = function (email, password) {
  var User = this;

  return User.findOne({'is_deleted':0,'email':email,'is_terminate':'no'}).populate('office_time').then((user) => {
    if (!user) {
      return Promise.reject('Invalid login details');
    }

    return new Promise((resolve, reject) => {
      // Use bcrypt.compare to compare password and user.password
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject('Invalid login details');
        }
      });
    });
  });
};

UserSchema.statics.findById = function (id) {
  var User = this;

  return User.findOne({'is_deleted':0,'_id':id}).populate('office_time').then((user) => {
    if (!user) {
      return Promise.reject('Invalid login details');
    }
    return user;
  });
};

UserSchema.pre('save', function (next) {
  var user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User}
