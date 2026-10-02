# Wavelength AI Marker: Circle-to-Explain

Circle any button on the dashboard and Claude explains what it does, using the feature registry and the numbers currently on screen.

## Run it

```bash
bun install
cp .env.example .env      # add your ANTHROPIC_API_KEY
bun run dev               # web on http://localhost:5173, API on :3001
```

## Flow

```
 BROWSER (frontend/src)                                         SERVER (backend)
 ======================                                         ================

 1. HOVER AI BUTTON
    AssistantFab.tsx -> menu: [Mark it] [Ask] [What's new] [Show me how]
            |
            | user picks "Mark it" (pencil)
            v
 2. MARKER MODE
    useAssistant.startMarker()
    MarkerOverlay.tsx = transparent full-screen layer
      pointerdown / pointermove / pointerup  -> list of (x, y) points
      perfect-freehand turns the points into the orange stroke
            |
            | pointerup -> handleStroke(points)
            v
 3. FIND THE CIRCLED BUTTON
    lib/detect-target.ts  detectTarget(points)
      a. visibleFeatureElements()  -> every element with data-feature="..."
      b. getBoundingClientRect() on each one
      c. lib/geometry.ts rankCandidates(): score how well each rect
         fits inside the stroke's box  ->  best match
         (tap = elementsFromPoint, nothing tagged = nearest button/link)
            |
            | best = <button data-feature="signal-rank">
            v
 4. HIGHLIGHT + CONFIRM                       GET /api/features ------> registry.ts
    useAssistant.select(target)                (names for the label)    summaries()
      - Spotlight.tsx: blur layer with a hole cut around the button
      - Ring (GSAP): orange ring scales onto the button
      - ConfirmBar.tsx: [Signal Rank] [X] [->] placed with floating-ui
      - lib/capture.ts captureRegion(): screenshot crop starts now
            |
            | user clicks Send (->)
            v
 5. COLLECT CONTEXT
    useAssistant.sendSelection()
      collectSelection()  -> featureId, label, text, nearby row/section text
      collectPage()       -> page id, visible feature ids
      getLiveState()      -> filters, counts, at-risk, Signal Rank preview
                             (dashboard/state.tsx)
      screenshot          -> JPEG data URL
            |
            | lib/stream-chat.ts  POST /api/chat  (JSON body)
            v
                                                     6. BUILD THE PROMPT
                                                        routes/chat.ts chatHandler()
                                                          validate body
                                                          prompt.ts buildSystemPrompt():
                                                            rules + answer format
                                                            registry.ts getFeature(featureId)
                                                              <- shared/feature-registry.json
                                                            related + other page features
                                                            <selection> + <live_page_data>
                                                          prompt.ts buildMessages():
                                                            [image block, question text]
                                                              |
                                                              v
                                                     7. CALL CLAUDE
                                                        @anthropic-ai/sdk
                                                        messages.stream({ system, messages })
                                                              |
            +-------------------------------------------------+
            |  SSE: data: {"type":"text","text":"..."}  (many)
            |       data: {"type":"done"}
            v
 8. SHOW THE ANSWER
    stream-chat.ts reads the stream chunk by chunk
    useAssistant appends each chunk to the assistant message
    ChatPanel.tsx renders it as markdown; ring stays on the button
    follow-up questions reuse the same selection (no image)
```

## What Claude receives

| Piece | Comes from | Example |
| --- | --- | --- |
| Rules and answer format | `backend/prompt.ts` | "Every claim must come from the registry..." |
| Circled feature's entry | `shared/feature-registry.json` via `backend/registry.ts` | `signal-rank`: whatItDoes, howToUse, options |
| Related and other page features | same registry | Health Pulse, At-risk accounts |
| Selection details | browser, `lib/collect-context.ts` | tag, text, nearby row text, candidates |
| Live page data | browser, `dashboard/state.tsx` | Datadog score 122: usage down 31%, renews in 18 days |
| Screenshot | browser, `lib/capture.ts` | JPEG crop around the button |
| Question | browser, `assistant/useAssistant.tsx` | "What does Signal Rank do?" |

## Adding a feature

1. Add an entry to `shared/feature-registry.json`.
2. Put `data-feature="<id>"` on the element.
