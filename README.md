# Soft Days

**https://soft-days-app.vercel.app**

Soft Days is a small web app for getting through your period. It's for the cramps, but also for the other stuff that comes with them: the bad mood, the tiredness, the feeling that your whole day is ruined and nobody really gets it.

Most period apps are trackers first. They want you to log everything and they show you charts. This one starts from a different question: it hurts right now, so what actually helps? Tracking is in there, but it's one tab out of eight.

There are no accounts, no streaks and no points you can lose. The garden on the home screen grows when you use the app and never dies if you don't.

## What's in it

**It hurts right now.** The button that's always in the corner. It's the fastest thing in the app: cold water on your face, then one long, slow exhale, with a timer to follow.

**Relief.** A 15 minute warmth timer (studies show steady low heat works about as well as ibuprofen for period pain), guided sessions for pressure points and stretches, and food and drink that actually help.

**Breathe.** 4-7-8 breathing with an orb you follow, box breathing for when a cramp spikes, and 5-4-3-2-1 grounding for when your head won't be quiet.

**Play.** Things to keep your hands busy while you wait for the painkiller to kick in: bubble pop, a sand garden, a koi pond, a kaleidoscope, a stress ball, a cat you can pet, a worry lantern that floats away (nothing you type is saved), a gratitude jar, wind chimes and a few more. None of them has a score, and you can't lose at any of them.

**Forest.** A focus timer for studying on a bad day. Plant a seed, stay on the tab, and it grows into a tree. If you leave the tab, it withers. It's the same idea as the Forest app.

**Mind.** Short affirmations, CBT, ACT and DBT exercises written in plain language, a private journal, and a section on why your mood shifts during your cycle (it's hormones, not you being dramatic).

**Track.** Log your period start and get a predicted next date. Tap any day on the calendar to log flow, cramps, sleep, water, symptoms and notes. It also shows your month in numbers and your mood over the last two weeks.

**Doctor.** A five-question check-in. Based on your answers, it tells you one of three things: this sounds like ordinary period pain, it's worth booking an appointment, or you should get seen today. It then writes a message you can send to a parent or a doctor, filled in with your own logs (your cycle length, how many days had severe cramps, your most common symptoms). That way you aren't stuck trying to explain it all from memory.

There's also a chat companion. It's an AI told to answer like a friend texting back: short, kind, and never dismissive. It won't diagnose anything, and if something sounds serious it will tell you to talk to a real person.

You can switch between five themes (Dawn, Dusk, Sea, Cocoon and Deep night) and turn sound and vibration on or off.

## Privacy

Everything stays in your browser by default. Nothing is sent anywhere unless you use the chat or turn on sync.

Sync is optional. You pick a passcode, and your data gets encrypted on your own device (AES-GCM, with the key made from your passcode using PBKDF2) before it's uploaded. The server only ever stores scrambled data, saved under a hash of your passcode, so whoever runs the server can't read it. The downside is that if you forget your passcode, there's no way to get your data back.

## How it's built

There's no framework and no build step:

```
index.html          the whole app: HTML, CSS and JS in one file
api/chat.js         sends chat messages to Gemini (the API key stays on the server)
api/sync.js         stores and returns the encrypted sync data
api/admin-count.js  returns how many synced records exist, and nothing else
```

The app is hosted on Vercel, and the `api/` files run as serverless functions. Sync data is stored in Upstash Redis.

### Running it yourself

To see the app, just open `index.html` in a browser. Everything works except chat and sync.

For the API routes, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Environment variables:

| Variable | What it's for |
|---|---|
| `GEMINI_API_KEY` | the chat companion |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | sync storage (the `UPSTASH_REDIS_REST_*` names work too) |
| `ADMIN_KEY` | protects `/api/admin-count` |

If any of these are missing, that feature turns itself off. The rest of the app keeps working.

## Disclaimer

Soft Days is here for comfort and information. It is not a diagnosis. If anything in it disagrees with what your doctor tells you, trust your doctor. Pain bad enough to make you faint, very heavy bleeding, or anything that feels different from your usual cramps is worth getting checked.
