# Eyeze — prototype (v3)

Voice-first eye check for rural patients, with a separate optometrist portal.
Built for the ZEISS Vision Care hackathon, Theme 3. All patient data is mock data.

## Run
Serve the folder (needed for camera and for the two pages to sync):

    python3 -m http.server 8000

- Patient app:        http://localhost:8000/
- Optometrist portal: http://localhost:8000/#optometrist  (demo login is pre-filled)

Open both in two tabs: reports sent from the patient app appear in the portal,
and the optometrist's reply and video invite appear back in the patient app.
Use Chrome for voice input.

## Demo
Demo controls (bottom right):
- Patient app: "Guided demo" plays Ramappa's journey hands-free; "Simulate no internet" shows offline saving.
- Portal: "Auto-review" opens the new report, replies, and sends a video-call invite.

## Video consultation (Google Meet)
In the portal, "Video consultation (Google Meet)" opens Google Calendar with the
patient's details filled in. Click "Add Google Meet video conferencing", save,
paste the Meet link back and press "Send invite to patient".
("Instant meeting" opens meet.google.com/new.)

## Where to edit (all in index.html)
- `const Q=[` — interview questions; `parent` = which answer it follows up on, `cond` = when it appears
- `const SCENE=[` — items in the "what looks blurry" activity
- `function computeResult` — dominance, triage, lens suggestion and tips
- `function seedPatients` — mock patients in the portal
