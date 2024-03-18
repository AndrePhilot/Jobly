"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureIsAdmin,
  ensureIsAdminOrUser
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");
const adminJwt = jwt.sign({ username: "admin", isAdmin: true }, SECRET_KEY);

describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
     //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});

describe("ensureIsAdmin", () => {
  test("works for admin", () => {
    // Mock res.locals.user to simulate an admin user
    const res = { locals: { user: { isAdmin: true } } };
    // Mock next function
    const next = jest.fn();

    // Call the middleware function
    ensureIsAdmin({}, res, next);

    // Assert that next function is called
    expect(next).toHaveBeenCalled();
  });

  test('should throw UnauthorizedError when res.locals.user is undefined', () => {
    // Mock res.locals.user to simulate undefined
    const res = { locals: {} };
    // Mock next function
    const next = jest.fn();
  
    // Call the middleware function
    ensureIsAdmin({}, res, next);
  
    // Assert that next function is called with an error
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    // Assert that the error message is as expected
    expect(next.mock.calls[0][0].message).toBe("Unauthorized");
  });

  test('should throw UnauthorizedError when user is not admin', () => {
    // Mock res.locals.user to simulate undefined
    const res = { locals: { user: { isAdmin: false } } };
    // Mock next function
    const next = jest.fn();
  
    // Call the middleware function
    ensureIsAdmin({}, res, next);
  
    // Assert that next function is called with an error
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    // Assert that the error message is as expected
    expect(next.mock.calls[0][0].message).toBe("Unauthorized");
  });
})

describe("ensureIsAdminOrUser", () => {
  test("works for admin", () => {
    // Mock res.locals.user to simulate an admin user
    const res = { locals: { user: { isAdmin: true } } };
    // Mock next function
    const next = jest.fn();

    // Call the middleware function
    ensureIsAdminOrUser({}, res, next);

    // Assert that next function is called
    expect(next).toHaveBeenCalled();
  });

  test("works for user", () => {
    // Mock req.params.user to simulate a URL request
    const req = { params: { username: "username" } };
    // Mock res.locals.user to simulate an logged in user
    const res = { locals: { user: { username: "username" } } };
    // Mock next function
    const next = jest.fn();

    // Call the middleware function
    ensureIsAdminOrUser(req, res, next);

    // Assert that next function is called
    expect(next).toHaveBeenCalled();
  });

  test('should throw UnauthorizedError when res.locals.user does not exist', () => {
    // Mock res.locals.user to simulate undefined
    const res = { locals: {} };
    // Mock req.params.username
    const req = { params: { username: 'testuser' } };
    // Mock next function
    const next = jest.fn();
  
    // Call the middleware function
    ensureIsAdminOrUser(req, res, next);
  
    // Assert that next function is called with an error
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    // Assert that the error message is as expected
    expect(next.mock.calls[0][0].message).toBe("Unauthorized");
  });

  test('should throw UnauthorizedError when isAdmin property is undefined', () => {
    // Mock res.locals.user to simulate a user that is not admin
    const res = { locals: { user: { isAdmin: null } } };
    // Mock req.params.username
    const req = { params: { username: 'testuser' } };
    // Mock next function
    const next = jest.fn();
  
    // Call the middleware function
    ensureIsAdminOrUser(req, res, next);
  
    // Assert that next function is called with an error
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    // Assert that the error message is as expected
    expect(next.mock.calls[0][0].message).toBe("Unauthorized");
  });
});