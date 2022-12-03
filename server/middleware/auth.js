const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // access the parsed cookies on the request


  // look up the user data related to that session
  // assign an object to a session property on the request that contains relevant user information

  if (req.cookies.shortlyid) {
    let hash = req.cookies.shortlyid;
    models.Sessions.get({ hash })
      .then((data) => {
        if (data) {
          req.session = { hash: data.hash, userId: data.userId, user: data.user };
          next();
        } else {
          req.cookies = {};
          models.Sessions.create()
            .then(data => {
              return models.Sessions.get({ id: data.insertId });
            })
            .then((data) => {
              const sessionObj = { hash: data.hash };
              req.session = sessionObj;
              // middleware function should use this unique hash to set a cookie in the repsonse headers
              res.cookie('shortlyid', data.hash);
              next();
            });
        }
      });
  }

  // if incoming request with no cookies, generate a session with unique hash and store in the sessions database
  if (Object.keys(req.cookies).length === 0) {
    models.Sessions.create()
      .then(data => {
        //    console.log('created Session');
        return models.Sessions.get({ id: data.insertId });
      })
      .then((data) => {
        //     console.log(data, 'data here');
        const sessionObj = { hash: data.hash };
        req.session = sessionObj;
        // middleware function should use this unique hash to set a cookie in the repsonse headers
        res.cookie('shortlyid', data.hash);
        next();
      });
  }

  //next();
  // )

  // if incoming cookie is not valid -- ???

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

