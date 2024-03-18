"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
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
  const newJob = {
    title: "Civil Engineer",
    salary: 200000,
    equity: 0,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);

    const id = job.id;

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);
    expect(result.rows).toEqual([
      {
        id: id,
        title: "Civil Engineer",
        salary: 200000,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
    await Job.remove(id);
  });

  test("not found when company_handle does not exist", async function () {
    try {
      await Job.create({
        title: "Civil Engineer",
        salary: 200000,
        equity: 0,
        companyHandle: "not_in_db",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
    expect(jobs).toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c1",
        })
    );
    expect(jobs).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const newJob = {
        title: "Civil Engineer",
        salary: 200000,
        equity: 0,
        companyHandle: "c1",
      };
    
    const createJob = await Job.create(newJob);

    let job = await Job.get(createJob.id);
    expect(job).toEqual({
      id: createJob.id,
      title: createJob.title,
      salary: createJob.salary,
      equity: String(createJob.equity),
      company: [{
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      }],
    });
    await Job.remove(createJob.id);
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
    // Define createJob outside of the test functions
    let createJob;

    // Use an async function to perform setup before running the tests
    beforeAll(async () => {

        const newJob = {
            title: "Civil Engineer",
            salary: 200000,
            equity: 0,
            companyHandle: "c1",
        };

        // Create the job and store the result in createJob
        createJob = await Job.create(newJob);
    });

    // Use an async function to perform setup after running the tests
    afterAll(async () => {

        // Remove the job
        await Job.remove(createJob.id);
    });

    test("works", async function () {
        const updateData = {
            title: "New",
            salary: 99999,
            equity: 0.090,
        };

        // Use createJob in the test
        let job = await Job.update(createJob.id, updateData);
        expect(job).toEqual({
            id: createJob.id,
            title: updateData.title,
            salary: updateData.salary,
            equity: String(updateData.equity),
            companyHandle: createJob.companyHandle,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`, [createJob.id]);
        expect(result.rows).toEqual([{
            id: createJob.id,
            title: "New",
            salary: 99999,
            equity: "0.09",
            companyHandle: "c1",
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null,
        };

        let job = await Job.update(createJob.id, updateDataSetNulls);
        expect(job).toEqual({
            id: createJob.id,
            title: updateDataSetNulls.title,
            salary: null,
            equity: null,
            companyHandle: createJob.companyHandle,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`, [createJob.id]);
        expect(result.rows).toEqual([{
            id: createJob.id,
            title: "New",
            salary: null,
            equity: null,
            companyHandle: "c1",
        }]);
    });

    test("not found if no such job", async function () {
        const updateData = {
            title: "New",
            salary: 99999,
            equity: 0.090,
        };
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(createJob.id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("bad request with id in data", async function () {
        try {
            await Job.update(createJob.id, {
                id: createJob.id,
                title: "New",
                salary: 99999,
                equity: 0.090,
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
            expect(err.message).toBe("id or company_handle cannot be updated");
        }
    });

    test("bad request with company_handle in data", async function () {
        try {
            await Job.update(createJob.id, {
                company_handle: createJob.companyHandle,
                title: "New",
                salary: 99999,
                equity: 0.090,
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
            expect(err.message).toBe("id or company_handle cannot be updated");
        }
    });

    test("bad request with id and company_handle in data", async function () {
        try {
            await Job.update(createJob.id, {
                id: createJob.id,
                company_handle: createJob.companyHandle,
                title: "New",
                salary: 99999,
                equity: 0.090,
            });
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
            expect(err.message).toBe("id or company_handle cannot be updated");
        }
    });
});

/************************************** remove */

describe("remove", function () {
    // Define createJob outside of the test functions
    let createJob;

    // Use an async function to perform setup before running the tests
    beforeAll(async () => {

        const newJob = {
            title: "Civil Engineer",
            salary: 200000,
            equity: 0,
            companyHandle: "c1",
        };

        // Create the job and store the result in createJob
        createJob = await Job.create(newJob);
    });
    
    test("works", async function () {
        await Job.remove(createJob.id);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1",[createJob.id]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** filter */

describe("filter existing data using one, some or all params", function () {

  test("filter by title only and that applies to multiple entries", async function () {
    const filterQuery = "title=er";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c1",
        })
    );
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
  });

  test("filter by title only with lowercase letters", async function () {
    const filterQuery = "title=des";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c1",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
  });

  test("filter by name only and that applies to a single entry", async function () {
    const filterQuery = "title=architect";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c2",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
  });

  test("filter by minSalary only", async function () {
    const filterQuery = "minSalary=200000";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c2",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
  });

  test("filter by minSalary only and that applies to multiple entries", async function () {
    const filterQuery = "minSalary=50000";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c1",
        })
    );
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
  });

  test("filter by minSalary only with value that is not a number", async function () {
    const filterQuery = "minSalary=high";
    
    try {
      await Job.filter(filterQuery);
      // Fail the test if no error is thrown
      fail("Expected an error to be thrown.");
    } catch (error) {
        // Check if the error is an instance of DatabaseError or has the expected message
        expect(error.constructor.name).toBe("DatabaseError");
        expect(error.message).toContain("invalid input syntax for type integer");
    }
  });

  test("filter by hasEquity even though value is false", async function () {
    const filterQuery = "hasEquity=false";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c1",
        })
    );
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
  });

  test("filter by hasEquity only and that applies to multiple entries", async function () {
    const filterQuery = "hasEquity=true";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Architect",
            salary: 100000,
            equity: "0.090",
            companyHandle: "c1",
        })
    );
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c2",
        })
    );
  });

  test("filter by title and minSalary only", async function () {
    const filterQuery = "title=er&minSalary=200000";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c2",
        })
    );
  });

  test("filter by title and hasEquity only", async function () {
    const filterQuery = "title=er&hasEquity=true";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c2",
        })
    );
  });

  test("filter by title, minSalary and hasEquity", async function () {
    const filterQuery = "title=er&hasEquity=false&minSalary=200000";
    
    let job = await Job.filter(filterQuery);
    expect(job).toContainEqual(
        expect.objectContaining({
            title: "Barber",
            salary: 200000,
            equity: "0.050",
            companyHandle: "c3",
        })
    );
    expect(job).not.toContainEqual(
        expect.objectContaining({
            title: "Designer",
            salary: 50000,
            equity: "0",
            companyHandle: "c2",
        })
    );
  });

  test("filter by title but entry doesn't exist", async function () {
    const filterQuery = "title=Doesntexist";
    
    await expect(Job.filter(filterQuery)).rejects.toThrowError(NotFoundError);
  });
});