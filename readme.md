# Jobly Backend

This is the Express backend for Jobly, version 2.

To create the PostgreSQL database with username permission:

    psql -U your_username -f jobly.sql

To create the PostgreSQL database with default user:

    psql -f jobly.sql

Install dependencies:

    npm install

To run this:

    npm start
    
To run the tests:

    npm run test

## Usage Scenarios

### Authentication

#### Obtaining JWT Token
- To obtain a JWT token for authentication, you can send a POST request to `/auth/token` with the `username` and `password` in the request body. This route returns a JWT token which can be used for further authentication.

#### Registering a New User
- To register a new user, send a POST request to `/auth/register` with the user details including `username`, `password`, `firstName`, `lastName`, and `email`. This route returns a JWT token for the newly registered user.

### Companies

#### Creating a Company
- To create a new company, send a POST request to `/companies` with the company details including `handle`, `name`, `description`, `numEmployees`, and `logoUrl`. This route requires admin authorization.

#### Retrieving Companies
- To retrieve a list of companies, send a GET request to `/companies`. You can filter the results based on parameters like `minEmployees`, `maxEmployees`, and `name`. No authorization is required for this route.

#### Retrieving a Company by Handle
- To retrieve information about a specific company by its handle, send a GET request to `/companies/:handle`.

#### Updating a Company
- To update information about a company, send a PATCH request to `/companies/:handle` with the fields you want to update.

#### Deleting a Company
- To delete a company, send a DELETE request to `/companies/:handle`. This route requires admin authorization.

### Jobs

#### Creating a Job
- To create a new job, send a POST request to `/jobs` with the job details including `title`, `salary`, `equity`, and `companyHandle`. This route requires admin authorization.

#### Retrieving Jobs
- To retrieve a list of jobs, send a GET request to `/jobs`. You can filter the results based on parameters like `title`, `minSalary`, and `hasEquity`.

#### Retrieving a Job by ID
- To retrieve information about a specific job by its ID, send a GET request to `/jobs/:id`.

#### Updating a Job
- To update information about a job, send a PATCH request to `/jobs/:id` with the fields you want to update. This route requires admin authorization.

#### Deleting a Job
- To delete a job, send a DELETE request to `/jobs/:id`. This route requires admin authorization.

### Users

#### Adding a New User
- To add a new user, send a POST request to `/users` with the user details including `username`, `password`, `firstName`, `lastName`, and `email`. This route requires admin authorization.

#### Applying for a Job
- To apply for a job, send a POST request to `/users/:username/jobs/:id`. This route requires admin authorization or the user's own authorization.

#### Retrieving Users
- To retrieve a list of users, send a GET request to `/users`. This route requires admin authorization.

#### Retrieving a User by Username
- To retrieve information about a specific user by their username, send a GET request to `/users/:username`. This route requires admin authorization or the user's own authorization.

#### Updating a User
- To update information about a user, send a PATCH request to `/users/:username` with the fields you want to update. This route requires admin authorization or the user's own authorization.

#### Deleting a User
- To delete a user, send a DELETE request to `/users/:username`. This route requires admin authorization or the user's own authorization.