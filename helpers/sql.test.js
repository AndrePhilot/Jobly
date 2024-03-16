"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("tests the sqlForPartialUpdate function", function () {
  let jsToSql; // Declare jsToSql variable outside beforeEach

  beforeEach(() => {
    // Initialize jsToSql before each test
    jsToSql = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };
  });

  test("should throw BadRequestError for empty data object", () => {
      const dataToUpdate = {};
      expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrowError(BadRequestError, "No data");
    });

  test("should return the correct sql query when data is provided", () => {
    const dataToUpdate = {
      firstName: "Jane",
      lastName: "Doe",
      isAdmin: true
    };

    // Call the function and store its return value
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    // Match the return value with the expected object
    expect(result).toEqual({
      "setCols": "\"first_name\"=$1, \"last_name\"=$2, \"is_admin\"=$3",
      "values": ["Jane", "Doe", true]
    });  
  });

  test("when data has only one key", () => {
    const dataToUpdate = {
      firstName: "Jane",
    };

    // Call the function and store its return value
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    // Match the return value with the expected object
    expect(result).toEqual({
      "setCols": "\"first_name\"=$1",
      "values": ["Jane"]
    });  
  });

  test("when data has only one key", () => {
    const dataToUpdate = {
      firstName: "Jane",
    };

    // Call the function and store its return value
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    // Match the return value with the expected object
    expect(result).toEqual({
      "setCols": "\"first_name\"=$1",
      "values": ["Jane"]
    });  
  });
});