# uptime-monitor

One small, config-driven monitor for all my projects. It does two jobs:

1. **Keep free hosting awake.** A Supabase free project pauses after about 7 days without
   activity. A scheduled request that reaches the database stops that.
2. **Tell me when something is down.** If any check fails, the GitHub Actions run fails and
   GitHub emails me. Optionally it also sends a push through [ntfy](https://ntfy.sh).

It has no dependencies. Everything it watches is listed in `projects.json`.

## Add a project

Easiest, from this folder:

```bash
npm run add -- my-project health https://my-project.example.com/health
npm run add -- my-project health https://my-project.example.com/health --contains '"status":"ok"'
npm run check      # try it now
```

Or edit `projects.json` by hand and add an entry to `checks`. See
[docs/add-a-project.md](docs/add-a-project.md) for every field and for what makes a good health
URL.

Commit and push. The next scheduled run picks it up. `npm run validate` and CI reject a bad entry.

## How it runs

| Workflow        | When                  | What it does                                              |
| --------------- | --------------------- | --------------------------------------------------------- |
| `monitor.yml`   | every 3 hours         | runs every enabled check, fails the run if one is down    |
| `test.yml`      | pull requests, `main` | unit tests and config validation                          |
| `heartbeat.yml` | monthly               | one commit on a `heartbeat` branch so GitHub keeps the schedule on |

You can also run the monitor on demand: Actions tab, Monitor, Run workflow.

## Alerts

- **Email:** on by default. GitHub emails the repo owner when a scheduled workflow fails. Check
  Settings, Notifications, "Actions" if you do not get them.
- **Push (optional):** add a repository secret `NTFY_TOPIC` (an unguessable name, for example
  `uptime-9f3k2x...`), then subscribe to that topic in the ntfy app.

## Rules for this repo

- **No secrets, ever.** The config holds public URLs only. The validator rejects credentials in a
  URL and query parameters named like a token or key. If a check ever needs a secret, put it in
  GitHub Actions secrets and read it from the environment.
- **Health URLs must be safe to call by anyone** and must not return personal data.
- A failure shows only a short reason (`timed out`, `status 503`), never the raw error.

## Good to know

- GitHub may start a scheduled run several minutes late. That is fine for keep-alive.
- GitHub switches scheduled workflows off after 60 days with no repo activity. The monthly
  heartbeat is meant to prevent that. If you ever see the Monitor workflow marked disabled, press
  Enable.
- Oracle's Always Free account needs a sign-in at least every 60 days, and idle Always Free VMs can
  be reclaimed. Pinging keeps the app answering but is not a substitute for checking Oracle.
- Supabase's pause rules can change. Check the dashboard if a project pauses anyway.
