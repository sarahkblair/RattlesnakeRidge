# Rattlesnake Ridge Homestead Hub

A personal homestead management app for Sarah & Kyle — 44 acres in West Texas.

---

## Prerequisites

Before you begin, make sure you have these installed on your Windows machine:

- **Node.js 18 or higher** — download from [nodejs.org](https://nodejs.org)  
  Verify with: `node --version`
- **Git** — you likely already have this

---

## 1. Install Dependencies

Open a command prompt in the project folder and run:

```cmd
npm install
```

This installs all packages including Next.js, Prisma, and the AI/Google libraries.

---

## 2. Configure Environment Variables

Copy the example file and fill in your values:

```cmd
copy .env.example .env
```

Then open `.env` in Notepad (or any text editor) and set:

```
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\service-account-key.json
GOOGLE_DOC_ID=your_google_doc_id_here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Google Docs Setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Search for "Google Docs API" → Enable it
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Give it a name (e.g., "rattlesnake-ridge"), click Create
6. Skip the optional role/user steps — just click Done
7. Click the service account you just created → **Keys** tab → **Add Key → Create new key → JSON**
8. Save the downloaded JSON file somewhere safe (e.g., `C:\Users\Sarah\rr-service-account.json`)
9. Set `GOOGLE_APPLICATION_CREDENTIALS` in your `.env` to that full file path

### Share the Google Doc with the Service Account

1. Open the downloaded JSON key file in Notepad
2. Find the `"client_email"` field — it looks like `name@project.iam.gserviceaccount.com`
3. Open your "RR Recipe Vault" Google Doc
4. Click **Share** (top right) and share it with that email address (Viewer or Editor access)

### Get the Google Doc ID

The Doc ID is in the URL: `docs.google.com/document/d/`**THIS_PART**`/edit`

Copy just the middle part and paste it as `GOOGLE_DOC_ID` in your `.env`.

### Anthropic API Key

Get your key from [console.anthropic.com](https://console.anthropic.com) → API Keys.

---

## 3. Set Up the Database

Run the Prisma migration to create the local SQLite database:

```cmd
npx prisma migrate dev --name init
```

You should see: `Your database is now in sync with your schema.`

---

## 4. Start the Dev Server

```cmd
npm run dev
```

The server starts on port 3000. Open your browser to:

```
http://localhost:3000
```

The app automatically redirects to the Meal Planner.

---

## 5. Access from Your Samsung Tablet

The dev server is already configured to accept connections from other devices on your WiFi.

**Find your computer's local IP address:**

```cmd
ipconfig
```

Look for the line under your WiFi adapter:

```
IPv4 Address. . . . . . . . . . . : 192.168.1.XXX
```

On your Samsung tablet, open Chrome or any browser and go to:

```
http://192.168.1.XXX:3000
```

(Replace `192.168.1.XXX` with your actual IP.)

> **Tip:** Your IP can change if your router reassigns it. If the tablet can't connect next time, run `ipconfig` again to get the current IP.

---

## Recipe Vault — Google Doc Format

The app expects recipes in this exact format inside your "RR Recipe Vault" Google Doc:

```
Sourdough Boule              ← bold text, one line
Bread                        ← category (plain text)
American                     ← cuisine (plain text)
• 500g bread flour           ← bullet list (ingredients)
• 350ml warm water
• 10g salt
• 5g active dry yeast
1. Combine flour and water   ← numbered list (steps)
2. Knead for 10 minutes
3. Let rise 1 hour
```

- Recipe name must be **bold**
- Each recipe is separated by the next bold name
- The app syncs automatically on load and via the **Sync** button in the Recipe Vault

---

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npx prisma studio` | Visual database browser (open at localhost:5555) |
| `npx prisma migrate dev` | Apply schema changes to the database |
| `npx prisma migrate reset` | ⚠️ Wipe and recreate the database |

---

## Modules

| Module | Status | Path |
|--------|--------|------|
| 🍽️ Meal Planner | ✅ Active | `/meal-planner` |
| 🌱 Garden | 🔜 Coming Soon | `/garden` |
| 🥫 Pantry & Preservation | 🔜 Coming Soon | `/pantry` |
| 🔧 Maintenance | 🔜 Coming Soon | `/maintenance` |
| 🥩 Butcher Guides | 🔜 Coming Soon | `/butcher` |
| 📋 Projects | 🔜 Coming Soon | `/projects` |

---

## Troubleshooting

**App won't start:**  
Run `npm install` again, then `npx prisma generate`.

**"Google Doc unreachable" on sync:**  
- Check that your `.env` has the correct `GOOGLE_APPLICATION_CREDENTIALS` path
- Make sure the JSON file path uses double backslashes or forward slashes: `C:/Users/Sarah/key.json`
- Confirm the doc is shared with the service account email

**Kitchen Assistant not responding:**  
Check that `ANTHROPIC_API_KEY` is set in your `.env` and the key is valid.

**Tablet can't connect:**  
Run `ipconfig` to get your current IP. Make sure both devices are on the same WiFi network (not guest network).

**Database errors:**  
Run `npx prisma migrate dev` to sync the database schema.
