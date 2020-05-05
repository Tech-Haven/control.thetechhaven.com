// Middleware function
// DESC:  Check if a user is authenticated or not.

module.exports = async (req, res, next) => {
  if (!req.session.lab_token) {
    return res.status(401).json({ errors: [{ msg: `Unauthorized. Please login to the Lab Login` }] })
  }
  next()
};
