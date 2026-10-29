# Setting up the prototype in Google

These steps take about ten minutes. You do them once; later milestones only replace or add files.

## Step 1. The Google Sheet

The Sheet is named **PHPPS Portfolio Prototype (fictional data)** and has eight tabs: Students, Enrolments, StaffRoles, Prompts, Reflections, Academic, Evidence and Feedback.

- If Claude created it in your Drive, open it from Drive.
- Otherwise, upload `seed/PHPPS_Portfolio_Data.xlsx` to Google Drive, right-click it, choose **Open with > Google Sheets**, then **File > Save as Google Sheets**.

Do not share this Sheet with anyone. Teachers and students will reach the data only through the web app.

## Step 2. Add the script files

1. In the Sheet, choose **Extensions > Apps Script**. A new tab opens with a file called `Code.gs`.
2. Rename the project (top left) to **PHPPS Portfolio**.
3. For each file in the `apps-script` folder, create a file with the same name and paste in its contents:

| File | How to create it in the Script editor |
| --- | --- |
| Code.gs | Already exists. Delete its contents and paste. |
| Config.gs | Click **+** next to Files, choose **Script**, type `Config` |
| Data.gs | **+**, **Script**, type `Data` |
| Access.gs | **+**, **Script**, type `Access` |
| Index.html | **+**, **HTML**, type `Index` |
| Styles.html | **+**, **HTML**, type `Styles` |
| Client.html | **+**, **HTML**, type `Client` |

The editor adds `.gs` or `.html` itself, so type the name without it.

4. Click the **Save** icon.

## Step 3. Check the setup

1. In the toolbar, choose the function **checkSetup** from the dropdown and click **Run**.
2. The first time, Google asks you to authorise the script. Choose your account, then **Advanced > Go to PHPPS Portfolio (unsafe) > Allow**. This warning appears because the script is your own and has not been reviewed by Google; it is expected.
3. The Execution log should say: *All eight tabs are present with the correct columns.*

## Step 4. Open the web app

1. Click **Deploy > New deployment**.
2. Click the gear icon and choose **Web app**.
3. Description: `Milestone 1`. Execute as: **Me**. Who has access: **Only myself**.
4. Click **Deploy**, then open the **Web app URL**.

For the demo with your school leader you can later change access to "Anyone with Google account". Because the app runs as you, they still cannot open the Sheet itself.

## Updating to a later milestone

Paste the changed files, save, then choose **Deploy > Manage deployments**, click the pencil icon, set Version to **New version**, and click **Deploy**. The URL stays the same.
