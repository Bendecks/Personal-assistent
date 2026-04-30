# Shortcut v1 for iOS 26.3 (23D127): Text braindump to GitHub inbox

Goal: Send a quick Danish text braindump from iPhone Shortcuts into `data/inbox.jsonl`.

This guide is written for iOS 26.3 (23D127) on iPhone.

This is v1. It only supports text. Images come later.

## Important

Shortcuts needs a GitHub Personal Access Token with permission to edit this private repository.

Recommended token type:
- Fine-grained personal access token
- Repository access: `Bendecks/Personal-assistent`
- Permissions: Contents: Read and write

Do not commit the token to GitHub. Store it only inside the Shortcut for now.

## Shortcut name

`Personal Assistent Capture`

## Actions in Shortcuts, iOS 26.3

### 1. Text

Add a `Text` action.

Content:

```text
PASTE_YOUR_GITHUB_TOKEN_HERE
```

Rename this action variable to:

```text
GitHubToken
```

### 2. Dictate Text

Add `Dictate Text`.

Settings:
- Prompt: `Hvad vil du gemme?`
- Language: Danish
- Stop Listening: After Pause

Rename output variable to:

```text
BraindumpText
```

### 3. Get Current Date

Add `Current Date`.

### 4. Format Date

Add `Format Date`.

Settings:
- Date: Current Date
- Format: ISO 8601

Rename output variable to:

```text
CreatedAt
```

### 5. Text

Add a `Text` action.

Content:

```text
pa-${CreatedAt}
```

Rename output variable to:

```text
EntryId
```

This is used as a simple unique id. It is good enough for v1.

### 6. Dictionary

Add `Dictionary`.

Create these keys:

```text
id = EntryId
created_at = CreatedAt
source = shortcut
type = text
text = BraindumpText
processed = false
```

Rename output variable to:

```text
NewEntryDictionary
```

### 7. Get Dictionary from Input

This step is not needed if the previous action already outputs a dictionary.

### 8. Get Text from Input

Add `Get Text from Input` using `NewEntryDictionary`.

This should create JSON-like text. If Shortcuts does not output valid JSON here, replace this step with a manual `Text` action:

```json
{"id":"EntryId","created_at":"CreatedAt","source":"shortcut","type":"text","text":"BraindumpText","processed":false}
```

In the manual version, insert each variable using the variable picker. Do not type variable names literally.

Rename output variable to:

```text
NewJsonLine
```

### 9. URL

Add `URL`.

Value:

```text
https://api.github.com/repos/Bendecks/Personal-assistent/contents/data/inbox.jsonl
```

### 10. Get Contents of URL — GET existing inbox

Add `Get Contents of URL`.

Settings:
- Method: GET
- Headers:
  - Authorization: `Bearer GitHubToken`
  - Accept: `application/vnd.github+json`
  - X-GitHub-Api-Version: `2022-11-28`

Use the variable picker for `GitHubToken`.

Rename output variable to:

```text
GitHubFileResponse
```

### 11. Get Dictionary Value

Add `Get Dictionary Value`.

Settings:
- Dictionary: `GitHubFileResponse`
- Key: `content`

Rename output variable to:

```text
ExistingBase64Content
```

### 12. Base64 Decode

Add `Base64 Encode` action and change it to `Decode` if iOS shows the combined encode/decode action.

Input:

```text
ExistingBase64Content
```

Rename output variable to:

```text
ExistingInboxContent
```

### 13. Text — combined inbox

Add `Text`.

Content:

```text
ExistingInboxContent
NewJsonLine
```

Important: make sure there is a newline between the existing content and the new JSON line.

Rename output variable to:

```text
CombinedInboxContent
```

### 14. Base64 Encode

Add `Base64 Encode`.

Input:

```text
CombinedInboxContent
```

Rename output variable to:

```text
CombinedBase64Content
```

### 15. Get Dictionary Value — sha

Add `Get Dictionary Value`.

Settings:
- Dictionary: `GitHubFileResponse`
- Key: `sha`

Rename output variable to:

```text
CurrentSha
```

### 16. Dictionary — update body

Add `Dictionary`.

Create these keys:

```text
message = Capture braindump from iOS Shortcut
content = CombinedBase64Content
sha = CurrentSha
branch = main
```

Rename output variable to:

```text
UpdateBody
```

### 17. Get Contents of URL — PUT updated inbox

Add another `Get Contents of URL`.

URL:

```text
https://api.github.com/repos/Bendecks/Personal-assistent/contents/data/inbox.jsonl
```

Settings:
- Method: PUT
- Request Body: JSON
- JSON body: `UpdateBody`
- Headers:
  - Authorization: `Bearer GitHubToken`
  - Accept: `application/vnd.github+json`
  - X-GitHub-Api-Version: `2022-11-28`

### 18. Show Notification

Add `Show Notification`.

Text:

```text
Gemt i Personal Assistent
```

## Expected result

The Shortcut appends one JSONL line to:

```text
data/inbox.jsonl
```

That file update triggers the GitHub Action automatically.

## Known iOS 26.3 friction points

- Variable insertion must be done with the variable picker. Do not type variable names literally.
- The Base64 action may appear as one action where you choose Encode or Decode.
- Dictionary values sometimes need to be explicitly converted to Text before Base64 encoding.
- If JSON building from Dictionary is unreliable, use the manual Text JSONL method in step 8.

## Later: Shortcut v2

- Add typed input option.
- Add Share Sheet input.
- Add image input.
- Add screenshot input.
- Add confirmation showing what was captured.
- Replace direct GitHub file editing with a safer API endpoint.
