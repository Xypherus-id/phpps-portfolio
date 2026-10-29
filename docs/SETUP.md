# Setting up the prototype in Google

These steps take about ten minutes. You do them once; later milestones only replace or add files.

## Step 1. Open the Google Sheet

Open **PHPPS Portfolio Prototype (fictional data)** in your Google Drive:
https://docs.google.com/spreadsheets/d/1Aac9GIVfqO1Z9OYJs-6O58QuD-rfGrepYG_Y081xpos/edit

It starts empty. Step 3 fills it.

Do not share this Sheet with anyone. Teachers and students will reach the data only through the web app.

## Step 2. Add the script files

1. In the Sheet, choose **Extensions > Apps Script**. A new tab opens with a file called `Code.gs`.
2. Click **Untitled project** (top left) and rename it **PHPPS Portfolio**.
3. Open the repository at https://github.com/Xypherus-id/phpps-portfolio/tree/main/apps-script. For each file there, open it on GitHub, click the **Copy raw file** icon (two overlapping squares, top right of the file), and paste it into a file of the same name in the Script editor:

| File | How to create it in the Script editor |
| --- | --- |
| Code.gs | Already exists. Select all of its contents, delete, then paste. |
| Config.gs | Click **+** next to Files, choose **Script**, type `Config` |
| Data.gs | **+**, **Script**, type `Data` |
| Access.gs | **+**, **Script**, type `Access` |
| Seed.gs | **+**, **Script**, type `Seed` |
| Scan.gs | **+**, **Script**, type `Scan` |
| Portfolio.gs | **+**, **Script**, type `Portfolio` |
| Index.html | **+**, **HTML**, type `Index` |
| Styles.html | **+**, **HTML**, type `Styles` |
| StudentView.html | **+**, **HTML**, type `StudentView` |
| Client.html | **+**, **HTML**, type `Client` |

The editor adds `.gs` or `.html` itself, so type the name without it. You do not need `appsscript.json`.

4. Click the **Save** icon (or press Ctrl+S).

## Step 3. Fill the Sheet with the demo data

1. Open `Seed.gs`. In the toolbar, choose **setupDemoData** from the function dropdown and click **Run**.
2. The first time, Google asks you to authorise the script. Choose your account, then **Advanced > Go to PHPPS Portfolio (unsafe) > Allow**. This warning appears because the script is your own and has not been reviewed by Google; it is expected.
3. When the Execution log says *Demo data written*, go back to the Sheet tab. You should see eight tabs: Students, Enrolments, StaffRoles, Prompts, Reflections, Academic, Evidence and Feedback.

Run **setupDemoData** again at any time to reset the demo to its starting state, for example just before presenting. It replaces everything in the eight tabs.

## Step 4. Check the setup

Choose **checkSetup** from the dropdown and click **Run**. The Execution log should say: *All eight tabs are present with the correct columns.*

## Step 5. Open the web app

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Description: `Milestone 1`. Execute as: **Me**. Who has access: **Only myself**.
4. Click **Deploy**, then open the **Web app URL**. Bookmark it.

For the demo with your school leader you can later change access to "Anyone with Google account". Because the app runs as you, they still cannot open the Sheet itself.

## Updating to a later milestone

Paste the changed files, save, then choose **Deploy > Manage deployments**, click the pencil icon, set Version to **New version**, and click **Deploy**. The URL stays the same.

## Updating from Milestone 1 to Milestone 2

1. In the Script editor, create three new files and paste their contents from GitHub: **Scan.gs**, **Portfolio.gs** and **StudentView.html**.
2. Replace the contents of these existing files with the new versions from GitHub: **Config.gs**, **Data.gs**, **Access.gs**, **Seed.gs**, **Index.html**, **Styles.html** and **Client.html**. Code.gs has not changed.
3. Save, then run **setupDemoData** once. The demo data gained a few rows linking the sample photos to the photo question.
4. Google asks you to authorise again, because the app now stores photos in your Drive. Allow it as before.
5. Deploy a new version (see "Updating to a later milestone" above).

Uploaded photos go into a private folder in your Drive called **PHPPS Portfolio Uploads (fictional data)**. The app creates it the first time a photo is added. Do not share it.

## If something goes wrong

- **"Only the owner of this Sheet can run this function"**: you are signed in to a different Google account from the one that owns the Sheet. Switch account in the top right.
- **A yellow banner in the web app saying the Sheet is not set up correctly**: run setupDemoData again.
- **"Script function not found: doGet"**: Code.gs was not saved. Save and deploy a new version.
