"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilterCompany, sqlForFilterJob } = require("./sql");

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
});

describe("tests the sqlForFilterCompany function", function () {

  test("should return the correct sql query when data is provided on the three valid keys", () => {
    const dataToFilter = {
      name: "Jane",
      minEmployees: 1,
      maxEmployees: 2
    };

    // Call the function and store its return value
    const result = sqlForFilterCompany(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: 'WHERE "name" ILIKE $1 AND "num_employees" >= $2 AND "num_employees" <= $3',
      values: [`%${dataToFilter.name}%`, dataToFilter.minEmployees, dataToFilter.maxEmployees]
    });  
  });

  test("when data has only two keys", () => {
    const dataToFilter = {
      name: "Jane",
      minEmployees: 1
    };

    // Call the function and store its return value
    const result = sqlForFilterCompany(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: 'WHERE "name" ILIKE $1 AND "num_employees" >= $2',
      values: [`%${dataToFilter.name}%`, dataToFilter.minEmployees]
    });  
  });

  test("when data has only one keys", () => {
    const dataToFilter = {
      name: "Jane"
    };

    // Call the function and store its return value
    const result = sqlForFilterCompany(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: 'WHERE "name" ILIKE $1',
      values: [`%${dataToFilter.name}%`]
    });  
  });
});

describe("tests the sqlForFilterJob function", function () {

  test("should return the correct sql query when data is provided on the three valid keys", () => {
    const dataToFilter = {
      title: "Dentist",
      minSalary: 1,
      hasEquity: null
    };

    // Call the function and store its return value
    const result = sqlForFilterJob(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: 'WHERE title ILIKE $1 AND salary >= $2 AND equity <> 0',
      values: [`%${dataToFilter.title}%`, dataToFilter.minSalary]
    });  
  });

  test("when data has only two keys", () => {
    const dataToFilter = {
      title: "Dentist",
      minSalary: 1
    };

    // Call the function and store its return value
    const result = sqlForFilterJob(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: 'WHERE title ILIKE $1 AND salary >= $2',
      values: [`%${dataToFilter.title}%`, dataToFilter.minSalary]
    });  
  });

  test("when data has only one keys", () => {
    const dataToFilter = {
      title: "Dentist"
    };

    // Call the function and store its return value
    const result = sqlForFilterJob(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: 'WHERE title ILIKE $1',
      values: [`%${dataToFilter.title}%`]
    });  
  });

  test("when data is empty", () => {
    const dataToFilter = {};

    // Call the function and store its return value
    const result = sqlForFilterJob(dataToFilter);

    // Match the return value with the expected object
    expect(result).toEqual({
      whereClause: '',
      values: []
    });  
  });
});