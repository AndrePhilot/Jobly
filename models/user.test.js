"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
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

/************************************** authenticate */

describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
  });

  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("c1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

describe("register", function () {
  const newUser = {
    username: "new",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
    isAdmin: false,
  };

  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(false);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    await User.remove(newUser.username);
  });

  test("works: adds admin", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
      isAdmin: true,
    });
    expect(user).toEqual({ ...newUser, isAdmin: true });
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(true);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    await User.remove(newUser.username);
  });

  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  async () => {
    await User.remove(newUser.username);
  }
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
        isAdmin: false,
        jobs: [],
      },
      {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
        isAdmin: false,
        jobs: [],
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
      jobs: [],
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewF",
    email: "new@email.com",
    isAdmin: true,
  };

  test("works", async function () {
    let job = await User.update("u1", updateData);
    expect(job).toEqual({
      username: "u1",
      ...updateData,
    });
  });

  test("works: set password", async function () {
    let job = await User.update("u1", {
      password: "new",
    });
    expect(job).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        firstName: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await User.remove("u1");
    const res = await db.query(
        "SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      await User.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** apply */

describe("apply", function () {
  test("works for 1 application", async function () {
    const job = await Job.create({
      title: "title",
      salary: null,
      equity: null,
      companyHandle: "c2"
    });

    const application = await User.apply("u1", job.id);
    expect(application.jobId).toBe(job.id);

    const res = await db.query(
      `SELECT * FROM applications`);
    expect(res.rows[0].username).toBe("u1");
    expect(res.rows[0].job_id).toBe(job.id);
    expect(res.rows.length).toBe(1);

    await Job.remove(job.id);
  });

  test("works for 2 applications", async function () {
    const job1 = await Job.create({
      title: "title",
      salary: null,
      equity: null,
      companyHandle: "c2"
    });

    const job2 = await Job.create({
      title: "title",
      salary: null,
      equity: null,
      companyHandle: "c2"
    });

    const application1 = await User.apply("u1", job1.id);
    expect(application1.jobId).toBe(job1.id);

    const application2 = await User.apply("u1", job2.id);
    expect(application2.jobId).toBe(job2.id);

    const res = await db.query(
      `SELECT * FROM applications`);
    expect(res.rows[0].username).toBe("u1");
    expect(res.rows[1].username).toBe("u1");
    expect(res.rows[0].job_id).toBe(job1.id);
    expect(res.rows[1].job_id).toBe(job2.id);
    expect(res.rows.length).toBe(2);

    await Job.remove(job1.id);
    await Job.remove(job2.id);
  });

  test("NotFoundError missing user", async function () {
    try {
      await User.apply("u9", 1);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message.toLowerCase()).toContain('user');
    }
  });

  test("NotFoundError missing job id", async function () {
    try {
      await User.apply("u1", 1);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message.toLowerCase()).toContain('job');
    }
  });

  test("BadRequestError for the same user reapplying to the same job", async function () {
    const job = await Job.create({
      title: "title",
      salary: null,
      equity: null,
      companyHandle: "c2"
    });

    await User.apply("u1", job.id);
    try {
      await User.apply("u1", job.id);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.message).toEqual('This user has already applied to this job.');
      await Job.remove(job.id);
    }
  });
});