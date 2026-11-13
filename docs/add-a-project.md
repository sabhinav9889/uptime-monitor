# Adding a project or a repo

Each entry in `projects.json` under `checks` is one URL to call. A project can have several
checks (the API, the web app, an admin page).

## Fields

| Field            | Required | Default | Meaning                                                      |
| ---------------- | -------- | ------- | ------------------------------------------------------------ |
| `project`        | yes      |         | Group name, usually the repo name                            |
| `name`           | yes      |         | Check name, unique within the project                        |
| `url`            | yes      |         | Public `http(s)` URL. No credentials, no token in the query  |
| `method`         | no       | `GET`   | `GET` or `HEAD`                                              |
| `expectStatus`   | no       | `200`   | Status that counts as healthy                                |
| `expectContains` | no       |         | Text the body must contain (`GET` only)                      |
| `timeoutMs`      | no       | `20000` | Give up after this long                                      |
| `retries`        | no       | `2`     | Extra tries before reporting failure (0 to 5)                |
| `retryDelayMs`   | no       | `5000`  | Wait between tries                                           |
| `slowMs`         | no       | `8000`  | Passing but slower than this shows a warning                 |
| `enabled`        | no       | `true`  | Set `false` to park a check without deleting it              |
| `note`           | no       |         | Why this check exists                                        |

Anything under `defaults` applies to every check unless the check sets its own value.

## Picking a good URL

- **Supabase project:** use a public route that reads the database, so the request counts as
  activity. A route that only returns a fixed string is not enough. Shiksha Path uses
  `GET /v1/branding`.
- **App with its own database** (for example the Oracle VM): a `/health` route that checks the
  database and cache, such as home-awareness `/health`. Use `expectContains` to be sure it says ok.
- **Static site:** the home page. It cannot pause, so this only catches outages.
- The URL must be safe for anyone to call and must return no personal data.

## A new repo or a new Supabase project

1. Add a public read route or health route if it has none, and deploy it.
2. `npm run add -- <repo> <check> <url>`.
3. `npm run check`, then commit and push.
