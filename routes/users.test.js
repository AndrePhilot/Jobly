"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");
const Job = require("../models/job");

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

/************************************** POST /users */

describe("POST /users", function () {
  test("works for users: create non-admin w/ authorization", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for users: create admin w/ authorization", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for creating users: create non-admin w/o authorization", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for creating users: create admin w/o authorization", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /users/[username]/jobs/[id] */

describe("POST /users/:username/jobs/:id", function () {
  test("works for admin: apply to a job", async function () {
    
    const job = await request(app)
      .post("/jobs")
      .send({
        title: "title",
        salary: 0,
        equity: 0,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId = job.body.job.id;

    const resp = await request(app)
        .post(`/users/u4/jobs/${jobId}`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: jobId });

    await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u4Token}`);
  });

  test("works for user: apply to a job", async function () {
    
    const job = await request(app)
      .post("/jobs")
      .send({
        title: "title",
        salary: 0,
        equity: 0,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId = job.body.job.id;

    const resp = await request(app)
        .post(`/users/u1/jobs/${jobId}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: jobId });

    await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u4Token}`);
  });

  test("unauth: apply to a job but you're not an admin or the own user", async function () {
    
    const job = await request(app)
      .post("/jobs")
      .send({
        title: "title",
        salary: 0,
        equity: 0,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId = job.body.job.id;

    const resp = await request(app)
        .post(`/users/u4/jobs/${jobId}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);

    await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u1Token}`);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    const job = await request(app)
      .post("/jobs")
      .send({
        title: "title",
        salary: 0,
        equity: 0,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId = job.body.job.id;

    await db.query("DROP TABLE applications CASCADE");
    const resp = await request(app)
        .post(`/users/u4/jobs/${jobId}`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for users w/ authorization", async function () {
    const job1 = await request(app)
      .post("/jobs")
      .send({
        title: "title",
        salary: 0,
        equity: 0,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId1 = job1.body.job.id;

    const job2 = await request(app)
      .post("/jobs")
      .send({
        title: "title",
        salary: 0,
        equity: 0,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId2 = job2.body.job.id;

    await request(app)
      .post(`/users/u4/jobs/${jobId1}`)
      .set("authorization", `Bearer ${u4Token}`);

    await request(app)
      .post(`/users/u4/jobs/${jobId2}`)
      .set("authorization", `Bearer ${u4Token}`);
    
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
          jobs: [],
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
          jobs: [],
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
          jobs: [],
        },
        {
          username: "u4",
          firstName: "U4F",
          lastName: "U4L",
          email: "user4@user.com",
          isAdmin: true,
          jobs: [jobId1, jobId2],
        },
      ],
    });
    await request(app)
      .delete(`/jobs/${jobId1}`)
      .set("authorization", `Bearer ${u4Token}`);

    await request(app)
      .delete(`/jobs/${jobId2}`)
      .set("authorization", `Bearer ${u4Token}`);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for users w/o authorization", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for users that are admin", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: [],
      },
    });
  });

  test("works for users that are getting their own info", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: [],
      },
    });
  });

  test("works for admin and user has applied to two jobs", async function () {
    const job1 = await request(app)
      .post("/jobs")
      .send({
        title: "title1",
        salary: 0,
        equity: 0,
        companyHandle: "c1"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId1 = job1.body.job.id;

    const job2 = await request(app)
      .post("/jobs")
      .send({
        title: "title2",
        salary: 0,
        equity: 0,
        companyHandle: "c2"
      })
      .set("authorization", `Bearer ${u4Token}`);
    
    const jobId2 = job2.body.job.id;

    await request(app)
      .post(`/users/u4/jobs/${jobId1}`)
      .set("authorization", `Bearer ${u4Token}`);

    await request(app)
      .post(`/users/u4/jobs/${jobId2}`)
      .set("authorization", `Bearer ${u4Token}`);
    
    const resp = await request(app)
        .get("/users/u4")
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u4",
        firstName: "U4F",
        lastName: "U4L",
        isAdmin: true,
        email: "user4@user.com",
        jobs: [{
          id: jobId1,
          title: "title1",
          companyHandle: "c1",
          companyName: "C1"
        },
        { id: jobId2,
          title: "title2",
          companyHandle: "c2",
          companyName: "C2"}],
      },
    });

    await request(app)
      .delete(`/jobs/${jobId1}`)
      .set("authorization", `Bearer ${u4Token}`);

    await request(app)
      .delete(`/jobs/${jobId2}`)
      .set("authorization", `Bearer ${u4Token}`);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for users that are neither admin or the same user", async function () {
    const resp = await request(app)
        .get(`/users/u2`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for users that are admin", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for users that are patching their own info", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for users that are neither admin or the same user", async function () {
    const resp = await request(app)
        .patch(`/users/u2`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for users that are admin", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for users that are deleting their own info", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for users that are the only admin and are deleting their own info", async function () {
    const resp = await request(app)
        .delete(`/users/u4`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: "u4" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for users that are neither admin or the same user", async function () {
    const resp = await request(app)
        .delete(`/users/u2`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
