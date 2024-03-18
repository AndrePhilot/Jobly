"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 9999,
    equity: 0.05,
    companyHandle: "c1",
  };

  test("ok for users with credentials", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: resp.body.job.id,
        title: "new",
        salary: 9999,
        equity: "0.05",
        companyHandle: "c1",
      }
    });
  });

  test("ok for users with credentials missing non-null fields", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: resp.body.job.id,
        title: "new",
        salary: null,
        equity: null,
        companyHandle: "c1",
      }
    });
  });

  test("bad request with missing companyHandle data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10,
          equity: 0.050,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("companyHandle");
  });

  test("bad request with missing title data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 10,
          equity: 0.050,
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("title");
  });

  test("bad request with invalid salary data (negative integer)", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: -100,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("salary");
    expect(resp.body.error.message[0]).toContain("minimum");
  });

  test("bad request with invalid salary data type (float)", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: 1.2,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("salary");
    expect(resp.body.error.message[0]).toContain("integer");
  });

  test("bad request with invalid title data type", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          title: true,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("title");
    expect(resp.body.error.message[0]).toContain("string");
  });

  test("bad request with invalid title data (less than 1 character)", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          title: "",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("title");
    expect(resp.body.error.message[0]).toContain("minimum");
  });

  test("bad request with invalid title data (more than 50 characters)", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          title: "123456789012345678901234567890123456789012345678901",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("title");
    expect(resp.body.error.message[0]).toContain("maximum");
  });

  test("bad request with invalid equity data type (string)", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: "not-a-number",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("equity");
    expect(resp.body.error.message[0]).toContain("number");
  });

  test("bad request with invalid companyHandle data type (integer)", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          companyHandle: 9,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body.error.message[0]).toContain("companyHandle");
    expect(resp.body.error.message[0]).toContain("string");
  });

  test("unauthorized for lacking credentials", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon w/o credentials", async function () {
    const resp = await request(app).get("/jobs");
    const jobs = resp.body.jobs;

    // Check that the response contains an array of jobs
    expect(Array.isArray(jobs)).toBe(true);

    // Define the expected job details
    const expectedJobs = [
        {
            title: "j1",
            salary: 1,
            equity: "0",
            companyHandle: "c1",
        },
        {
            title: "j2",
            salary: 2,
            equity: "0.01",
            companyHandle: "c1",
        },
        {
            title: "j3",
            salary: 3,
            equity: "0.02",
            companyHandle: "c3",
        },
    ];

    // Check each job object in the response
    jobs.forEach((job, index) => {
        const expectedJob = expectedJobs[index];

        // Ensure each job object matches the expected details
        expect(job.salary).toEqual(expectedJob.salary);
        expect(job.title).toEqual(expectedJob.title);
        expect(job.equity).toEqual(expectedJob.equity);
        expect(job.companyHandle).toEqual(expectedJob.companyHandle);
    });

    // Check for the number of entries
    expect(jobs.length).toBe(3);
});

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("ok for filtering a job by title", async function () {
    const resp = await request(app).get("/jobs?title=2");
    const jobs = resp.body;

    // Define the expected job details
    const expectedJob = [
      {
          title: "j2",
          salary: 2,
          equity: "0.01",
          companyHandle: "c2",
      },
    ];

    // Ensure job object matches the expected details
    expect(jobs.title).toEqual(expectedJob.title);
    expect(jobs.salary).toEqual(expectedJob.salary);
    expect(jobs.equity).toEqual(expectedJob.equity);
    expect(jobs.companyHandle).toEqual(expectedJob.companyHandle);

    // Check for the number of entries
    expect(jobs.jobs.length).toBe(1);
  });

  test("ok for filtering a job by title and minSalary", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=3");
    const jobs = resp.body;

    // Define the expected job details
    const expectedJob = [
      {
          title: "j3",
          salary: 3,
          equity: "0.02",
          companyHandle: "c3",
      },
    ];

    // Ensure job object matches the expected details
    expect(jobs.title).toEqual(expectedJob.title);
    expect(jobs.salary).toEqual(expectedJob.salary);
    expect(jobs.equity).toEqual(expectedJob.equity);
    expect(jobs.companyHandle).toEqual(expectedJob.companyHandle);

    // Check for the number of entries
    expect(jobs.jobs.length).toBe(1);
  });

  test("ok for filtering a job by title, minSalary and hasEquity", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=3&hasEquity=true");
    const jobs = resp.body;

    // Define the expected job details
    const expectedJob = [
      {
          title: "j3",
          salary: 3,
          equity: "0.02",
          companyHandle: "c3",
      },
    ];

    // Ensure job object matches the expected details
    expect(jobs.title).toEqual(expectedJob.title);
    expect(jobs.salary).toEqual(expectedJob.salary);
    expect(jobs.equity).toEqual(expectedJob.equity);
    expect(jobs.companyHandle).toEqual(expectedJob.companyHandle);

    // Check for the number of entries
    expect(jobs.jobs.length).toBe(1);
  });

  test("filter by a title that does not exist in db", async function () {
    const response = await request(app).get("/jobs?title=a");
    expect(response.body.error.message).toEqual("No jobs found within the specified criteria.");
  });

  test("bad request on invalid filter key", async function () {
    const resp = await request(app)
        .get(`/jobs`)
        .query({ minSalary: 2, nope: "nope" });
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon w/ credentials", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app).get(`/jobs/${newJobResp.id}`);
      expect(resp.body).toEqual({
        jobs: {
          id: newJobResp.id,
          title: "new",
          salary: 9999,
          equity: "0.05",
          companyHandle: "c1",
        },
      });

    await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("works for anon w/o credentials", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)

      const resp = await request(app).get(`/jobs/${newJobResp.id}`);
      expect(resp.body).toEqual({
        jobs: {
          id: newJobResp.id,
          title: "new",
          salary: 9999,
          equity: "0.05",
          companyHandle: "c1",
        },
      });

    await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .get(`jobs/${newJobResp.id}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    };
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for users w/ credentials", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app)
          .patch(`/jobs/${newJobResp.id}`)
          .send({
            title: "title",
            salary: 9,
            equity: 0,
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
        job: {
          title: "title",
          salary: 9,
          equity: "0",
        },
      });

      await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("unauth for anon", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app)
          .patch(`/jobs/${newJobResp.id}`)
          .send({
            title: "title",
            salary: 9,
            equity: 0,
          });
      expect(resp.statusCode).toEqual(401);
      
      await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("unauthorized for lacking credentials", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app)
          .patch(`/jobs/${newJobResp.id}`)
          .send({
            title: "title",
            salary: 9,
            equity: 0,
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);

      await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app)
          .patch(`/jobs/${newJobResp.id}`)
          .send({
            id: 1,
            title: "title",
            salary: 9,
            equity: 0,
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);

      await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("bad request on invalid data", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app)
          .patch(`/jobs/${newJobResp.id}`)
          .send({
            title: true,
          })
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);

      await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .patch(`jobs/${newJobResp.id}`)
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(500);
    };
  });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works user w/ credential", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      const resp = await request(app)
          .delete(`/jobs/${newJobResp.id}`)
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({ deleted: newJobResp.id });
    };
  });

  test("unauth for anon", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    const newJobResp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4Token}`);
  
    const resp = await request(app)
      .delete(`/jobs/${newJobResp.id}`);
  
    expect(resp.statusCode).toEqual(401);

    await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
  });
  

  test("unauthorized for lacking credentials", async function () {
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

    const resp = await request(app)
        .delete(`/jobs/${newJobResp.id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);

    await request(app)
      .delete(`/jobs/${newJobResp.id}`)
      .set("authorization", `Bearer ${u4Token}`);
    };
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    const newJob = {
      title: "new",
      salary: 9999,
      equity: 0.05,
      companyHandle: "c1",
    };
  
    async () => {
      const newJobResp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u4Token}`);

      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .delete(`jobs/${newJobResp.id}`)
          .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(500);
    };
  });
});