# Baby Race

A live baby-shower game. Guests scan a QR code, pick Team Girl or Team Boy, and get a phone badge. A television shows the strollers racing as the votes come in.

The crowd’s winner is only a prediction. Announcing the baby’s actual gender is a separate host action, and it never happens on its own.

## Day-of checklist

1. Run the SQL migration and set a host password.
2. Add the two `VITE_` Supabase values locally, then on Vercel.
3. Open `/tv` on the television and tap **Fullscreen**.
4. Scan the QR code with your phone and cast a test vote. Confirm the stroller moves.
5. Vote the other team from a second phone.
6. On `/admin`, run a countdown, then **Back to the race**.
7. **Reset all votes** and unlock voting before guests arrive.
8. Leave `/admin` on your phone, not on the TV.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Wait until the database is ready.
3. Open **SQL Editor → New query**.
4. Paste the full contents of `supabase/migrations/20261021180000_baby_race.sql` and run it.

Running that file again deletes every vote. Do that only before guests arrive.

5. Set the host password in a second query. Use 16 or more letters and numbers, with no quotes. Do not commit this password.

```sql
update public.admin_config
set secret = 'replace-with-your-long-password'
where id = 1;
```

6. Open **Project Settings → API** and copy:
   - Project URL
   - `anon` public key (publishable key)

   Do not copy the `service_role` key. It is not used by this app.

7. If live updates do not appear later, open **Database → Publications → supabase_realtime** and make sure `game_state` is enabled. The migration adds it for you when that publication exists.

## 2. What the database does

- `votes` stores `id`, `guest_name`, `voter_id`, `team`, and `created_at`. `voter_id` is unique, so the same browser id cannot vote twice.
- `game_state` stores whether voting is open, the countdown, the crowd prediction, and the optional actual gender.
- Guests can read the race totals. They cannot read the guest list or the host password.
- Guests cannot insert, edit, or delete votes directly. Voting and host actions go through database functions.
- A saved anonymous id in the browser stops accidental double votes. It does not stop someone who opens another browser or clears site data. That is fine for a shower.

## 3. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Name | Where it goes | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env.local` and Vercel | Project URL from Supabase. |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` and Vercel | Anon / publishable key only. |
| `VITE_PUBLIC_URL` | Optional | Production URL, no trailing slash. QR codes use it when set. |

Leave the host password out of these variables. The host types it into `/admin`, and Supabase checks it.

If `VITE_PUBLIC_URL` is empty, the QR code uses the address currently open on the TV. That is correct when the TV is already on the production site. It is wrong if the TV is on `localhost`.

## 4. Run it locally

```bash
npm install
npm run dev
```

- Guest vote: `http://localhost:5173/`
- Television: `http://localhost:5173/tv`
- Host: `http://localhost:5173/admin`

The dev server listens on your network. For a phone test before deploy, open the TV page from your computer’s LAN address, for example `http://192.168.1.20:5173/tv`, not `localhost`. The QR code then points at an address the phones can reach. Phones must be on the same Wi-Fi.

## 5. Deploy to Vercel

The app is a static Vite site. `vercel.json` sends `/tv` and `/admin` to `index.html`.

1. Push the project to GitHub, or deploy the folder with the Vercel CLI.
2. Import it at [vercel.com/new](https://vercel.com/new). Vercel should detect Vite.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Add `VITE_PUBLIC_URL` after the first deploy if you want the QR code pinned to production.
4. Deploy.
5. Open `https://YOUR-SITE.vercel.app/tv` on the television.

If you set `VITE_PUBLIC_URL`, redeploy once so the TV bundle picks it up.

Production build on your own machine:

```bash
npm run build
npm run preview
```

## 6. Test with phones and a TV

1. Television on `/tv`, fullscreen, QR code visible from the couch.
2. Phone A scans, enters a name, picks Team Girl. The badge stays after refresh.
3. Within a few seconds the pink stroller moves and the TV shows `+1 for Team Girl!`.
4. Phone A cannot vote again. Refresh still shows the badge.
5. Phone B picks Team Boy. The blue stroller moves.
6. Refresh the TV. The totals stay correct.
7. On `/admin`, lock voting. A new phone sees that voting is closed. Unlock it again.
8. Start the countdown. The TV counts 5…1, then shows the crowd winner. That screen says it is the prediction.
9. **Back to the race** returns to the strollers.
10. Reset votes only when you mean it. The TV returns to zero. Phones drop their badges once they reconnect.
11. The actual-gender buttons are optional. Use one only when you are announcing the baby. The vote total never triggers that screen.

## Host controls

`/admin` asks for the Supabase password. A wrong password shows no guest names.

- Lock or unlock voting
- Start a 5…1 countdown, then show the crowd’s pick
- Skip straight to that celebration
- Return to the race
- Optionally announce the real gender
- Read names and teams
- Reset every vote, after a confirmation

Sign out on a shared phone. Do not put the password in the URL.

## If something misbehaves

- **Setup screen:** the anon key or URL is missing. Restart `npm run dev` after changing `.env.local`.
- **“Database is not set up”:** run the SQL migration.
- **“Host password is not set”:** run the `update public.admin_config` statement.
- **Votes save but the TV is frozen:** confirm `game_state` is in the `supabase_realtime` publication. The TV also refreshes every 5 seconds and keeps the last totals on screen during a blip.
- **QR code opens the wrong place:** open `/tv` on the public URL, or set `VITE_PUBLIC_URL`.
- **A guest voted twice:** they used a second browser. Ask them nicely. Reset only if you want to clear everyone.
