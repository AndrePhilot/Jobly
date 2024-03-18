"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
    await Company.remove(company.handle);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
    await Company.remove(newCompany.handle);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
      {
        handle: "d4",
        name: "D4",
        description: "Desc4",
        numEmployees: 0,
        logoUrl: "http://d4.img",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works w/ company that has multiple jobs", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
      jobs: [{
        id: expect.any(Number),
        title: "Architect",
        salary: 100000,
        equity: "0.090",
      },
      {
        id: expect.any(Number),
        title: "Designer",
        salary: 50000,
        equity: "0",
      }]
    });
  });

  test("works w/ company that has no jobs", async function () {
    let company = await Company.get("d4");
    expect(company).toEqual({
      handle: "d4",
      name: "D4",
      description: "Desc4",
      numEmployees: 0,
      logoUrl: "http://d4.img",
      jobs: []
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

  /************************************** filter */

describe("filter existing data using one, some or all params", function () {

  test("filter by name only and that applies to multiple entries", async function () {
    const filterQuery = {name: "c"};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("filter by name only and that applies to a single entry", async function () {
    const filterQuery = {name: "2"};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });

  test("filter by minEmployees only and that applies to a single entry", async function () {
    const filterQuery = { minEmployees: 3};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("filter by minEmployees only and that applies to multiple entries", async function () {
    const filterQuery = { minEmployees: 1};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("filter by minEmployees only with value that is not a number", async function () {
    const filterQuery = { minEmployees: "bunch"};
    
    try {
      await Company.filter(filterQuery);
      // Fail the test if no error is thrown
      fail("Expected an error to be thrown.");
    } catch (error) {
        // Check if the error is an instance of DatabaseError or has the expected message
        expect(error.constructor.name).toBe("DatabaseError");
        expect(error.message).toContain("invalid input syntax for type integer");
    }
  });

  test("filter by maxEmployees only and that applies to a single entry", async function () {
    const filterQuery = { maxEmployees: 1};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "d4",
        name: "D4",
        description: "Desc4",
        numEmployees: 0,
        logoUrl: "http://d4.img",
      },
    ]);
  });

  test("filter by maxEmployees only and that applies to multiple entries", async function () {
    const filterQuery = { maxEmployees: 3};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
      {
        handle: "d4",
        name: "D4",
        description: "Desc4",
        numEmployees: 0,
        logoUrl: "http://d4.img",
      },
    ]);
  });

  test("filter by maxEmployees only with value that is not a number", async function () {
    const filterQuery = { minEmployees: "bunch"};
    try {
      await Company.filter(filterQuery);
      // Fail the test if no error is thrown
      fail("Expected an error to be thrown.");
    } catch (error) {
        // Check if the error is an instance of DatabaseError or has the expected message
        expect(error.constructor.name).toBe("DatabaseError");
        expect(error.message).toContain("invalid input syntax for type integer");
    }
  });

  test("filter by name and maxEmployees only", async function () {
    const filterQuery = { name: "1", maxEmployees: 3};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    ]);
  });

  test("filter by name and minEmployees only", async function () {
    const filterQuery = { name: "c", minEmployees: 3};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  test("filter by name, minEmployees and maxEmployees", async function () {
    const filterQuery = { name: "c", maxEmployees: 2, minEmployees: 1};
    
    let company = await Company.filter(filterQuery);
    expect(company).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });

  test("filter by name, minEmployees, maxEmployees and an unauthorized criteria", async function () {
    const filterQuery = { name: "c", maxEmployees: 1, minEmployees: 2, age: 12};
    
    await expect(Company.filter(filterQuery)).rejects.toThrowError(BadRequestError);
  });

  test("filter by names, an unauthorized criteria", async function () {
    const filterQuery = { names: "c" };
    
    try {
        await Company.filter(filterQuery);
        // Fail the test if no error is thrown
        fail("Expected an error to be thrown.");
    } catch (error) {
        // Check if the error has the expected message indicating a syntax error
        expect(error.message).toContain("syntax error at end of input");
    }
  });

  test("minEmployees is greater than maxEmployees", async function () {
    const filterQuery = { maxEmployees: 1, minEmployees: 2};
    
    await expect(Company.filter(filterQuery)).rejects.toThrowError(BadRequestError);
  });

  test("filter by name but entry doesn't exist", async function () {
    const filterQuery = {name: "a"};
    
    await expect(Company.filter(filterQuery)).rejects.toThrowError(NotFoundError);
  });
});