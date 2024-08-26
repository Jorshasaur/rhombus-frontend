# RUNBOOK
![Team](https://img.shields.io/badge/team-slate-lightgrey.svg)
![Status](https://img.shields.io/badge/status-in_development-yellow.svg)
[ ![Codeship Status for InVisionApp/pages-ui](https://app.codeship.com/projects/bf81db20-95a2-0135-8be9-32c74d7f6e41/status?branch=testing)](https://app.codeship.com/projects/251332)

### Team
Pages-UI is owned by the Slate team.  Communication channels are:

| Channel | Description |
|---|---|
| #team-slate-core | The general Slate team channel |
| #team-slate-pr | The Slate team developer's channel |

### Technology Summary
Pages-UI is built on NodeJS and React using Typescript.  The Node server runs on [Express](https://expressjs.com/).  The service runs exclusively in v7 and requires the v7 Edge Gateway in order to retrieve logged in user data.

### How to run the service
The service entry point is called through `./start.sh`.  It checks to see if `NODE_ENV` is set for production and if so it runs the express server.  If `NODE_ENV` is not set for production then it runs the dev server through webpack.

### Builds 
Production builds for front end assets are executed from `yarn build`.  The builds should happen from webpack and output the build files into `./build`

### Dependencies

| Service  | Description   |
|---|---|
| Pages-API  | Pages-UI communicates with Pages-API for its data.  |

### Testing
Front end tests are written using Jest.  To execute the tests on an `invision-local` environment run `npm test`.

### Logging
The repo uses [invision-nodejs-logger](https://github.com/InVisionApp/invision-nodejs-logger) to format logs for Datadog.  

Important logs on Datadog are:

| Title | Link | Description |
|---|---|---|
| TBD | TBD | TBD |


### Feature Flags

| Flag Name | Description |
|---|---|
| `Rhombus: SLATE-158 - Enable UI` | When set to true this flag will enable the Rhombus UI. |
| `Rhombus: SLATE-158 - Has Access` | A flag to selectively give users access to the Rhombus UI. |