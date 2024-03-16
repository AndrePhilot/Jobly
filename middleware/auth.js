"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

// function ensureLoggedIn(req, res, next) {
//   try {
//     if (!res.locals.user) throw new UnauthorizedError();
//     return next();
//   } catch (err) {
//     return next(err);
//   }
// }

/** Middleware to use when they must be admin.
 *
 * If not, raises Unauthorized.
 */

function ensureIsAdmin(req, res, next) {
  try {
    // Check if res.locals.user exists and has the isAdmin property
    if (!res.locals.user || res.locals.user.isAdmin === undefined) {
      throw new UnauthorizedError();
    }

    // Check if the user is not an admin
    if (!res.locals.user.isAdmin) {
      throw new UnauthorizedError();
    }

    // If the user is an admin, proceed to the next middleware
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be admin or have 
 * the credentials of the user they're trying to 
 * operate on
 *
 * If not, raises Unauthorized.
 */

function ensureIsAdminOrUser(req, res, next) {
  try {
    // Check if res.locals.user exists and has the isAdmin property
    if (!res.locals.user || res.locals.user.isAdmin === undefined) {
      throw new UnauthorizedError();
    }

    // Check if the user is an admin
    if (res.locals.user.isAdmin) {
      // If the user is an admin, proceed to the next middleware
      return next();
    }

    // Check if the user requesting info is the same
    // user that is providing info
    if (res.locals.user.username === req.params.username) {
      // If the user is the same user they are requesting information about,
      // allow access to the route
      return next();
    }

    // If none of the conditions are met, the user is neither an admin nor
    // the same user requesting information, so throw an UnauthorizedError
    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureIsAdmin,
  ensureIsAdminOrUser,
};
