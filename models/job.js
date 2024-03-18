"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilterJob } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * 
   * Throws NotFoundError if companyHandle is not in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const handleCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [companyHandle]);

    if (!handleCheck.rows[0])
      throw new NotFoundError(`companyHandle ${companyHandle} not found in database.`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id,
                  title, 
                  salary, 
                  equity, 
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company }
   *   where company is [{ handle, name, description, numEmployees, logoUrl }]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT j.id,
                  j.title, 
                  j.salary, 
                  j.equity, 
                  c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl"
           FROM jobs j
           JOIN companies c
           ON j.company_handle = c.handle
           WHERE j.id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    const company = {
        handle: job.handle || '',
        name: job.name || '',
        description: job.description || '',
        numEmployees: job.numEmployees || '',
        logoUrl: job.logoUrl || ''
    };

    return {
        id: job.id,
        title: job.title,
        salary: job.salary,
        equity: job.equity,
        company: [company]
    };
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    if (data.id || data.company_handle) {
        throw new BadRequestError('id or company_handle cannot be updated');
    }

    const { setCols, values } = sqlForPartialUpdate(data,{});

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }

  /** This function receives a query string and selects
   * a job by one, some or all of these criteria: 
   * title, minSalary, hasEquity. 
   * When filtering by title, the match should be 
   * case-insensitive, meaning that "arc" value should 
   * be matched with the job "Architect".
   * hasEquity: if present, filter to jobs that provide a 
   * non-zero amount of equity.
   **/

  static async filter(criteria) {
    let criteriaObj = {};
    
    criteria.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      criteriaObj[key] = value;
    });

    const { whereClause, values } = sqlForFilterJob(
      criteriaObj);
    
    const result = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ${whereClause}
           ORDER BY title`,
        values);

    const jobs = result.rows;

    if (jobs.length === 0) {
      throw new NotFoundError(`No jobs found within the specified criteria.`);
    }

    return jobs;
  }
}

module.exports = Job;