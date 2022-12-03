const parseCookies = (req, res, next) => {
  const cookieObj = {};
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split('; ');

    for (var i = 0; i < cookies.length; i++) {
      const cookieParsed = cookies[i].split('=');
      cookieObj[cookieParsed[0]] = cookieParsed[1];
    }

  }
  req.cookies = cookieObj;
  next();
};


module.exports = parseCookies;