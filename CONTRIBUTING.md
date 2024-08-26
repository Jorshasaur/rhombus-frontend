# Contributing

## Local Development

### Base Requirements

- [Node.js](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com)

### Get up and running

1. Setup V7 Local Environment - https://github.com/InVisionApp/invision-local

2. Disable the non-development version of pages-ui

  1. Go to `invision-local` folder

  2. Create `docker-compose.override.yml` (or you can use [template](https://github.com/InVisionApp/invision-local#docker-composeoverrideymltemplate) from `invision-local` repository)

  3. Change `pages-ui` service overrides

    ```
    pages-ui:
        container_name: pages-ui-dummy
        image: tianon/true
        restart: "no"
        entrypoint: ["/true", "(RUNNING ELSEWHERE)"]
    ```

3. Clone `pages-ui`

  ```
  git clone git@github.com:InVisionApp/pages-ui.git
  cd pages-ui
  ```

4. Install `pages-ui` dependencies

  ```
  yarn install
  ```

5. Build and start for development

  ```
  docker-compose up
  ```

6. Open https://in.local.invision.works/rhombus


### Creating a feature branch

When you're starting a feature you should first make a branch off the `master` branch. Pull requests are automatically posted into the Slate PR channel and someone on the team will review the code. Once the code has been approved you should do a `Create a merge commit` from Github.

### Deploying to Production

Changes merged into `master` will be automatically deployed to our integration-v7 (invisionbeta) environment. Once you've confirmed that the changes merged work as intended on integration-v7 you may deploy to production using the standard Rosie steps.

_NOTE: Because we merge directly into `master` it's possible that other merged PR's will be carried along with your PR.  You should be sure that you're familiar with what those PR's contain before you tell Rosie to production. **If at any point you are unsure of what will be deployed please reach out to `@slate` on Slack**._

### Running tests

Run tests including `console.log` messages in std output

```
npm run test
```

Run tests without `console.log` messages in std output and with nice test report

```
npm run ci-test
```

Run test and watch for changes

```
npm run test-watch
```

#### Filtering Tests

Specify individual test files by CLI

```
npm run test -t 'components/Editor'
```


Specify within the tests

```
describe.only(...)
it.only(...)
```