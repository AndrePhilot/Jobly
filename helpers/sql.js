const { BadRequestError } = require("../expressError");

// This function is called whenever a sql entry needs
// to be updated. It receives a data object and returns
// an error if the object is empty, or the row names
// that need to be updated in a sql query format (setCols), 
// followed by their sqlinjection sequence - e.g. $1 for
// first row, $2 for second row, etc - (values)

function sqlForPartialUpdate(dataToUpdate, jsToSql) {  
  const keys = Object.keys(dataToUpdate);
  
  if (keys.length === 0) {
    throw new BadRequestError("No data");
  }

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate)
  };
}

// This function is called whenever a user wants to 
// select companies by one, some or all of these 
// criteria: name, minEmployees and maxEmployees. 
// It receives an object and returns the appropriate sql 
// query criteria (in a query, it goes after 'WHERE')
// with its respective sql injection numbers ($1, $2, $3)
// and the arrays containing the values to be filtered
// by 

function sqlForFilterCompany(dataToFilter) {
  const conditions = [];
  const values = [];

  for (const key in dataToFilter) {
    if (key === 'name') {
      conditions.push(`"${key}" ILIKE $${conditions.length + 1}`);
      values.push(`%${dataToFilter[key]}%`);
    } else if (key === 'minEmployees') {
      conditions.push(`"num_employees" >= $${conditions.length + 1}`);
      values.push(dataToFilter[key]);
    } else if (key === 'maxEmployees') {
      conditions.push(`"num_employees" <= $${conditions.length + 1}`);
      values.push(dataToFilter[key]);
    }
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  return {
    whereClause,
    values
  };
}

// This function is called whenever a user wants to 
// select jobs by one, some or all of these 
// criteria: title, minSalary and hasEquity. 
// It receives an object and returns the appropriate sql 
// query criteria (in a query, it goes after 'WHERE')
// with its respective sql injection numbers ($1, $2)
// and the arrays containing the values to be filtered
// by. title query should be case-insensitive, 
// matches-any-part-of-string search.
// minSalary filter to jobs with at least that salary.
// hasEquity: if true, filter to jobs that provide a 
// non-zero amount of equity. If false or not included 
// in the filtering, list all jobs regardless of equity.

function sqlForFilterJob(dataToFilter) {
  const conditions = [];
  const values = [];

  for (const key in dataToFilter) {
    if (key === 'title') {
      conditions.push(`title ILIKE $${values.length + 1}`);
      values.push(`%${dataToFilter[key]}%`);
    } else if (key === 'minSalary') {
      conditions.push(`salary >= $${values.length + 1}`);
      values.push(dataToFilter[key]);
    } else if (key === 'hasEquity') {
      if (dataToFilter[key] !== 'false' && dataToFilter[key] !== false) {
        conditions.push(`equity <> 0`);
      }
    }
  }

  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  console.log(whereClause, values);
  return {
    whereClause,
    values
  };
}

module.exports = { sqlForPartialUpdate, sqlForFilterCompany, sqlForFilterJob };