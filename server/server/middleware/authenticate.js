var {User} = require('./../models/user');
const jwt      = require('jsonwebtoken');
 
var authenticate = (req, res, next) => {
  var token = req.header('x-auth');
  jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {    
    if (err) {    
        res.status(400).send({message:'Please login'});
    }

  if(decoded){
    User.findByToken(token).then((user) => {
      if (!user) {
        return Promise.reject();
      }
      req.user = user;
      req.token = token;
      next();
    }).catch((e) => {
      res.status(400).send({message:'Please login'});
    });
  }

});
}

module.exports = {authenticate};
