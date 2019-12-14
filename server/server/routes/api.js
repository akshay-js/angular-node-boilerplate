const express = require('express');
const router  = express.Router();
var nodemailer = require('nodemailer');

const _ = require('lodash');

const { check, validationResult } = require('express-validator');
var {authenticate} = require('../middleware/authenticate');

var {User} = require('../models/user');

const bcrypt   = require('bcryptjs');


var signupValidation = [
  check('email').isEmail().withMessage('Please enter valid email').trim()
  .custom(value => {
      return  User.findOne({'is_deleted':0, "email" : { $regex : new RegExp(value, "i") } }).then(user => {
        if(user){
          throw new Error('this email is already in use');
        }
      })
    })
];

router.post('/signup', (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }

  var body       = _.pick(req.body, ['email', 'password', 'full_name']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send({
      "message": "Signup Successfully",
      data:user
    });
  }).catch((message) => {
    res.send({
      "ErrorCode": 900,
      message
    });
  })
});

/**
 * For User Login
 * @param  {[type]}   '/login' [description]
 * @param  {Function} (req,    res)          [description]
 * @return {[type]}            [description]
 */
router.post('/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password)
  .then((user) => {
    return user.generateAuthToken(req,res).then((token) => {
      res.header('x-auth', token).send({
      "message": "Login Successfully",
      data:user
    });
    });
  }).catch((message) => {
    res.send({
      "ErrorCode": 900,
      message
    });
  });
});


/**
 * For User Login
 * @param  {[type]}   '/login' [description]
 * @param  {Function} (req,    res)          [description]
 * @return {[type]}            [description]
 */
router.post('/forgotPassword', (req, res) => {
  var body = _.pick(req.body, ['email']);

  User.findOne({email:body.email,'is_deleted' : 0})
  .then((user1) => {
    if(!user1){
      res.status(400).send('Email id is not registered with us.');
      return false;
    }
    let time = new Date()
      time     = time.getTime();
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(time+user1.email, salt, (err, hash) => {
          password_set_token = hash;

          User.update({'_id':user1._id},{'password_set_token':password_set_token}).then((res1) => {
            
          


          var transporter = nodemailer.createTransport({
            host: "",
            port: 465,
            secure: true,  
            pool: true,
            auth: {
              user: process.env.smtpEmail,
              pass: process.env.smtpPassword
            },
            tls: {
                rejectUnauthorized:false
            }
          });

          let url = `${process.env.SITE_URL}/passwordSet?string=${password_set_token}`;
          var mailOptions = {
            from: process.env.siteFromEmail,
            to: user1.email,
            subject: 'Forgot Password',
            html: `
            `
          };

          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

          res.send({data:'We have sent an email. Please check your inbox.'});
          })

        });    
      });    
  }).catch((e) => {
    res.status(400).send('Email id is not registered with us.');
  });
});

/**
 * For User logout
 * @param  {[type]}   '/logout' [description]
 * @param  {Function} (req,    res)          [description]
 * @return {[type]}            [description]
 */
router.get('/logout',(req, res) => {
  res.send();
});
/**
 * Email Send
 * @param  {[type]} error   [description]
 * @param  {[type]} info){                 if (error) {      console.log(error);    } else {      console.log('Email sent: ' + info.response);    }  } [description]
 * @return {[type]}         [description]
 */
router.get('/emailSend', (req, res) => {

  var transporter = nodemailer.createTransport({
            host: "",
            port: 465,
            secure: true,  
            pool: true,
            auth: {
              user: process.env.smtpEmail,
              pass: process.env.smtpPassword
            },
            tls: {
                rejectUnauthorized:false
            }
          });

  var mailOptions = {
    from: process.env.siteFromEmail,
    to: '',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      // console.log(error);
    } else {
      // console.log('Email sent: ' + info.response);
    }
  });

  res.send('success');
});

/**
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
router.post('/user/checkTheToken',(req, res) => {

  var body = _.pick(req.body, ['token']);
    User.findOne({'password_set_token' : body.token}).then((result) => {
      if(result){
        //checkUser();
        res.send({message:'Valid URL'});
      }else{
        res.status(400).send({message:'Invalid URL'});
      }
    });
});

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = router
