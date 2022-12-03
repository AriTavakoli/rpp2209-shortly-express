const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const CookieParser = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(CookieParser);
app.use(Auth.createSession);



const verifySession = function () {


};



app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });


/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup', (req, res, next) => {
  res.render('signup');
});

app.post('/signup', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  models.Users.get({ username })
    .then((data) => {
      if (data) {
        // send them to the login
        res.redirect('/signup');
        next();
      } else {
        //create the user
        models.Users.create({ username, password })
          .then(user => {
            res.redirect('/');
            res.status(201).send(user);
            next();
            //return user;
          })
          .error(error => {
            console.log('error');
            res.status(500).send(error);
          });
      }
    });
});


app.get('/login', (req, res, next) => {
  res.render('login');
  next();
});

app.post('/login', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  models.Users.get({ username })
    .then((data) => {
      if (!data) {
        res.redirect('/login');
        next();
      } else if (models.Users.compare(password, data.password, data.salt)) {
        //res.redirect('/');
        console.log('logging req session', req.session);
        console.log('logging the data', data);

        models.Sessions.update({ hash: req.session.hash }, { userId: data.id })
          .then((data) => {
            console.log(data);
            // req.session.userId = data.insertId;
            // req.session.user = { user };
            console.log('updated session with username');
            res.redirect('/');
            models.Sessions.get({ hash: req.session.hash })
              .then((data) => {
                console.log('sesion was set as', data);
              });
          });
      } else {
        res.redirect('/login');
        next();


      }


    });




});








/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
