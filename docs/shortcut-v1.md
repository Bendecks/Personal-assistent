# Shortcut v1: Text braindump to GitHub inbox

Goal: Send a quick text braindump from iPhone Shortcuts into `data/inbox.jsonl`.

This is v1. It only supports text. Images come later.

## Important

Shortcuts needs a GitHub Personal Access Token with permission to edit this private repository.

Store it only inside the Shortcut for now.

Recommended token type:
- Fine-grained personal access token
- Repository access: `Bendecks/Personal-assistent`
- Permissions: Contents: Read and write

## Shortcut flow

Name: `Personal Assistent Capture`

Actions:

1. Dictate Text
   - Prompt: `Hvad vil du gemme?`
   - Language: Danish
   - Stop listening: After pause

2. Text
   - Use dictated text as variable `BraindumpText`

3. Get Current Date

4. Format Date
   - Format: ISO 8601

5. Generate UUID
   - If Shortcuts does not have UUID action, use current timestamp as fallback.

6. Text
   Build one JSONL line:

```json
{"id":"SHORTCUT_UUID","created_at":"ISO_DATE","source":"shortcut","type":"text","text":"BRAINDUMP_TEXT","processed":false}
```

7. Get Contents of URL
   - URL: `https://api.github.com/repos/Bendecks/Personal-assistent/contents/data/inbox.jsonl`
   - Method: GET
   - Headers:
     - Authorization: `Bearer YOUR_GITHUB_TOKEN`
     - Accept: `application/vnd.github+json`
     - X-GitHub-Api-Version: `2022-11-28`

8. Get Dictionary from Input

9. Get Value for Key
   - Key: `content`

10. Base64 Decode
    - Decode the existing file content.

11. Text
    Combine:

```text
EXISTING_INBOX_CONTENT
NEW_JSONL_LINE
```

12. Base64 Encode
    Encode the combined content.

13. Get Value for Key
    - Key: `sha`

14. Dictionary

```json
{
  "message": "Capture braindump from Shortcut",
  "content": "BASE64_COMBINED_CONTENT",
  "sha": "CURRENT_SHA",
  "branch": "main"
}
```

15. Get Contents of URL
    - URL: `https://api.github.com/repos/Bendecks/Personal-assistent/contents/data/inbox.jsonl`
    - Method: PUT
    - Request Body: JSON
    - Headers:
      - Authorization: `Bearer YOUR_GITHUB_TOKEN`
      - Accept: `application/vnd.github+json`
      - X-GitHub-Api-Version: `2022-11-28`

16. Show Notification
    - Text: `Gemt i Personal Assistent`

## Notes

- Updating `data/inbox.jsonl` triggers the GitHub Action automatically.
- The Action processes the inbox and writes to `data/processed.jsonl`.
- Later we should replace this direct file update with a safer API endpoint.

## Later: Shortcut v2

- Add typed text instead of dictation.
- Add image attachment.
- Add Share Sheet input.
- Add category hints.
- Add confirmation showing what was captured.
