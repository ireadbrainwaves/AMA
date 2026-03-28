import { useState, useCallback, useRef, useEffect } from "react";

const PLATFORMS = {
  twitter: { name: "Twitter/X", maxLen: 280, color: "#00ccff", icon: "𝕏" },
  reddit: { name: "Reddit", maxLen: 3000, color: "#ff6600", icon: "◉" },
  tiktok: { name: "TikTok", maxLen: 2200, color: "#ee1d52", icon: "♪" },
};

const CONTENT_ANGLES = [
  "weird factor",
  "aesthetic showcase", 
  "systems depth",
  "lore drop",
  "bug story",
  "design decision",
  "art process",
  "today I added",
];

const HASHTAGS = "#gamedev #indiedev #roguelike #pixelart #buildinpublic #fightinggame";

const SYSTEM_PROMPT = `You are a social media copywriter for AMA (Alien Martial Arts), an indie roguelike fighting game. The game has a dark sci-fi terminal aesthetic. Players pick an alien species (Cyber Gorilla, Psycho Squid, Bee Swarm, Terror Pin Turtle), fight through a 4-arena tournament ladder, harvest mutations from defeated opponents (grafting alien body parts onto themselves), buy cybernetic tech upgrades from a greedy robot merchant (RK-7 "Ark"), and become a Frankenstein mutant by the final fight against the Parasitex (a boss that steals your mutations).

Voice rules:
- First person, present tense: "I'm building..." not "We are developing..."
- Casual but specific. Never corporate. Never say "excited to announce" or "stay tuned"
- Self-deprecating is fine
- Show the work, not the pitch

You will receive a description of what the developer built or wants to post about, plus a content angle. Generate posts for the requested platforms.

Respond ONLY with valid JSON, no markdown, no backticks. Format:
{
  "twitter": { "text": "...", "notes": "brief suggestion for media to attach" },
  "reddit": { "title": "...", "body": "...", "subreddit": "r/gamedev or r/indiegaming or r/roguelikes or r/PixelArt", "notes": "media suggestion" },
  "tiktok": { "hook": "first 2 seconds text overlay", "caption": "...", "notes": "video content suggestion" }
}

Twitter: Under 260 chars (leave room for media link). Punchy. One key visual or idea. Include 2-3 relevant hashtags from: #gamedev #indiedev #screenshotsaturday #roguelike #fightinggame #pixelart #buildinpublic

Reddit: Title should be specific and interesting, not generic. Body should be 2-4 paragraphs with real detail — Reddit rewards depth. Include what you built, why the design decision matters, and what's next. Don't use bullet points.

TikTok: Hook must grab in under 2 seconds. Caption should be conversational with hashtags. Notes should describe what the video should show.`;

function PostCard({ platform, content, onEdit, onApprove, approved, onCopy }) {
  const p = PLATFORMS[platform];
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);

  const startEdit = () => {
    setEditing(true);
    if (platform === "twitter") setEditText(content.text);
    else if (platform === "reddit") setEditText(content.body);
    else setEditText(content.caption);
  };

  const saveEdit = () => {
    const updated = { ...content };
    if (platform === "twitter") updated.text = editText;
    else if (platform === "reddit") updated.body = editText;
    else updated.caption = editText;
    onEdit(platform, updated);
    setEditing(false);
  };

  const handleCopy = () => {
    let text = "";
    if (platform === "twitter") text = content.text;
    else if (platform === "reddit") text = `${content.title}\n\n${content.body}`;
    else text = `${content.hook}\n\n${content.caption}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mainText = platform === "twitter" ? content.text 
    : platform === "reddit" ? content.body 
    : content.caption;
  const charCount = mainText?.length || 0;
  const overLimit = charCount > p.maxLen;

  return (
    <div style={{
      background: "#0a1220",
      border: `1px solid ${approved ? "#00ff8840" : "#1a2838"}`,
      padding: 0,
      position: "relative",
      transition: "border-color 0.3s",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid #1a2838",
        background: approved ? "#00ff8808" : "transparent",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: p.color, fontSize: 18, fontFamily: "monospace" }}>{p.icon}</span>
          <span style={{ color: p.color, fontSize: 13, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
            {p.name.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
            color: overLimit ? "#ee6666" : "#4a6a7a",
          }}>
            {charCount}/{p.maxLen}
          </span>
          {approved && (
            <span style={{
              fontSize: 10, color: "#00ff88", fontFamily: "'Share Tech Mono', monospace",
              background: "#00ff8815", padding: "2px 6px", border: "1px solid #00ff8830",
            }}>QUEUED</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px" }}>
        {platform === "reddit" && (
          <div style={{
            color: "#e0f0f8", fontSize: 14, fontFamily: "'Share Tech Mono', monospace",
            marginBottom: 8, fontWeight: "bold",
          }}>
            {content.title}
            <span style={{ color: "#4a6a7a", fontWeight: "normal", fontSize: 11, marginLeft: 8 }}>
              → {content.subreddit}
            </span>
          </div>
        )}
        {platform === "tiktok" && content.hook && (
          <div style={{
            color: "#ee1d52", fontSize: 13, fontFamily: "'Share Tech Mono', monospace",
            marginBottom: 8, padding: "4px 8px", background: "#ee1d5210",
            border: "1px solid #ee1d5230",
          }}>
            HOOK: {content.hook}
          </div>
        )}

        {editing ? (
          <div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{
                width: "100%", minHeight: platform === "reddit" ? 160 : 80,
                background: "#080c14", color: "#e0f0f8", border: "1px solid #00ccff40",
                fontFamily: "'Share Tech Mono', monospace", fontSize: 12,
                padding: 10, resize: "vertical", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={saveEdit} style={btnStyle("#00ff88")}>save</button>
              <button onClick={() => setEditing(false)} style={btnStyle("#4a6a7a")}>cancel</button>
            </div>
          </div>
        ) : (
          <div style={{
            color: "#c0d0d8", fontSize: 12, fontFamily: "'Share Tech Mono', monospace",
            lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {mainText}
          </div>
        )}

        {content.notes && !editing && (
          <div style={{
            marginTop: 10, padding: "6px 10px", background: "#0f1a2e",
            borderLeft: `2px solid ${p.color}40`, fontSize: 11,
            color: "#6a8a9a", fontFamily: "'Share Tech Mono', monospace",
          }}>
            📎 {content.notes}
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div style={{
          display: "flex", gap: 6, padding: "8px 14px 12px",
          borderTop: "1px solid #0f1a2e",
        }}>
          <button onClick={startEdit} style={btnStyle("#00ccff")}>edit</button>
          <button onClick={handleCopy} style={btnStyle("#ccaa22")}>
            {copied ? "copied!" : "copy"}
          </button>
          <button
            onClick={() => onApprove(platform)}
            style={btnStyle(approved ? "#4a6a7a" : "#00ff88")}
          >
            {approved ? "unqueue" : "queue ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

function QueueItem({ item, index, onRemove }) {
  const p = PLATFORMS[item.platform];
  const preview = item.platform === "twitter" ? item.content.text
    : item.platform === "reddit" ? item.content.title
    : item.content.hook;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
      background: "#0a1220", borderLeft: `3px solid ${p.color}`,
      marginBottom: 4,
    }}>
      <span style={{ color: p.color, fontSize: 14, fontFamily: "monospace", width: 20 }}>{p.icon}</span>
      <span style={{
        flex: 1, color: "#c0d0d8", fontSize: 11,
        fontFamily: "'Share Tech Mono', monospace",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {preview}
      </span>
      <span style={{
        color: "#4a6a7a", fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
      }}>
        {item.day}
      </span>
      <button onClick={() => onRemove(index)} style={{
        background: "none", border: "none", color: "#ee666680",
        cursor: "pointer", fontSize: 14, padding: "2px 4px",
      }}>×</button>
    </div>
  );
}

const btnStyle = (color) => ({
  background: "transparent", border: `1px solid ${color}40`,
  color, fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
  padding: "4px 12px", cursor: "pointer", transition: "all 0.2s",
  letterSpacing: 0.5,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AMAContentQueue() {
  const [input, setInput] = useState("");
  const [angle, setAngle] = useState("today I added");
  const [platforms, setPlatforms] = useState({ twitter: true, reddit: false, tiktok: false });
  const [generated, setGenerated] = useState(null);
  const [approved, setApproved] = useState({});
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("compose"); // compose | queue
  const [scheduleDay, setScheduleDay] = useState("Monday");
  const inputRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const selectedPlatforms = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);

  const generate = async () => {
    if (!input.trim() || selectedPlatforms.length === 0) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    setApproved({});

    const userPrompt = `Content angle: ${angle}
Platforms needed: ${selectedPlatforms.join(", ")}
    
What I built / want to post about:
${input}

Generate posts for the specified platforms only. Return ONLY valid JSON with keys for: ${selectedPlatforms.join(", ")}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGenerated(parsed);
    } catch (err) {
      console.error(err);
      setError("Generation failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (platform, updated) => {
    setGenerated(prev => ({ ...prev, [platform]: updated }));
  };

  const handleApprove = (platform) => {
    setApproved(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const addToQueue = () => {
    const newItems = Object.entries(approved)
      .filter(([, v]) => v)
      .map(([platform]) => ({
        platform,
        content: generated[platform],
        day: scheduleDay,
        angle,
        addedAt: Date.now(),
      }));
    setQueue(prev => [...prev, ...newItems]);
    setGenerated(null);
    setApproved({});
    setInput("");
    setView("queue");
  };

  const removeFromQueue = (index) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const approvedCount = Object.values(approved).filter(Boolean).length;

  const queueByDay = DAYS.reduce((acc, day) => {
    acc[day] = queue.filter(item => item.day === day);
    return acc;
  }, {});

  const scanlineOverlay = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,204,255,0.015) 3px, rgba(0,204,255,0.015) 4px)",
    pointerEvents: "none", zIndex: 9999,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14", color: "#e0f0f8",
      fontFamily: "'Share Tech Mono', monospace", position: "relative",
    }}>
      <div style={scanlineOverlay} />

      {/* Header */}
      <div style={{
        padding: "20px 24px 16px", borderBottom: "1px solid #1a2838",
        background: "linear-gradient(180deg, #0a1220 0%, #080c14 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <span style={{ color: "#4a6a7a", fontSize: 11, letterSpacing: 2 }}>// EVERGREEN STUDIOS</span>
            <h1 style={{
              margin: "4px 0 0", fontSize: 20, fontWeight: "normal",
              color: "#00ccff", letterSpacing: 3,
            }}>
              AMA CONTENT QUEUE
            </h1>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setView("compose")}
              style={{
                ...btnStyle(view === "compose" ? "#00ccff" : "#4a6a7a"),
                background: view === "compose" ? "#00ccff10" : "transparent",
                padding: "6px 16px",
              }}
            >compose</button>
            <button
              onClick={() => setView("queue")}
              style={{
                ...btnStyle(view === "queue" ? "#00ff88" : "#4a6a7a"),
                background: view === "queue" ? "#00ff8810" : "transparent",
                padding: "6px 16px",
              }}
            >
              queue {queue.length > 0 && `(${queue.length})`}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>

        {view === "compose" && (
          <>
            {/* Input Section */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#6a8a9a", fontSize: 11, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                // WHAT DID YOU BUILD?
              </label>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g. Added mutation weakness indicators. You can now see which attacks deal 2x to specific body parts. Shows a 'WEAK! 2x' badge in the target select panel."
                style={{
                  width: "100%", minHeight: 100, background: "#0a1220",
                  color: "#e0f0f8", border: "1px solid #1a2838",
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 13,
                  padding: 14, resize: "vertical", outline: "none",
                  boxSizing: "border-box", lineHeight: 1.6,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#00ccff40"}
                onBlur={e => e.target.style.borderColor = "#1a2838"}
              />
            </div>

            {/* Angle + Platform Select */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ color: "#6a8a9a", fontSize: 11, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                  // CONTENT ANGLE
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {CONTENT_ANGLES.map(a => (
                    <button
                      key={a}
                      onClick={() => setAngle(a)}
                      style={{
                        background: angle === a ? "#ccaa2220" : "transparent",
                        border: `1px solid ${angle === a ? "#ccaa22" : "#1a2838"}`,
                        color: angle === a ? "#ccaa22" : "#6a8a9a",
                        fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
                        padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                      }}
                    >{a}</button>
                  ))}
                </div>
              </div>

              <div style={{ minWidth: 160 }}>
                <label style={{ color: "#6a8a9a", fontSize: 11, letterSpacing: 1, display: "block", marginBottom: 6 }}>
                  // PLATFORMS
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {Object.entries(PLATFORMS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => setPlatforms(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{
                        background: platforms[key] ? `${p.color}15` : "transparent",
                        border: `1px solid ${platforms[key] ? p.color : "#1a2838"}`,
                        color: platforms[key] ? p.color : "#4a6a7a",
                        fontSize: 12, fontFamily: "'Share Tech Mono', monospace",
                        padding: "6px 12px", cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={loading || !input.trim() || selectedPlatforms.length === 0}
              style={{
                width: "100%", padding: "12px 0",
                background: loading ? "#0f1a2e" : "#00ccff10",
                border: `1px solid ${loading ? "#1a2838" : "#00ccff50"}`,
                color: loading ? "#4a6a7a" : "#00ccff",
                fontSize: 14, fontFamily: "'Share Tech Mono', monospace",
                cursor: loading ? "wait" : "pointer",
                letterSpacing: 2, transition: "all 0.2s",
                opacity: (!input.trim() || selectedPlatforms.length === 0) ? 0.4 : 1,
              }}
            >
              {loading ? "◌ GENERATING..." : "⚡ GENERATE POSTS"}
            </button>

            {error && (
              <div style={{
                marginTop: 12, padding: "10px 14px", background: "#ee666615",
                border: "1px solid #ee666630", color: "#ee6666", fontSize: 12,
              }}>{error}</div>
            )}

            {/* Generated Posts */}
            {generated && (
              <div style={{ marginTop: 24 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 12,
                }}>
                  <span style={{ color: "#6a8a9a", fontSize: 11, letterSpacing: 1 }}>
                    // GENERATED — REVIEW & EDIT
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selectedPlatforms.map(p => generated[p] && (
                    <PostCard
                      key={p}
                      platform={p}
                      content={generated[p]}
                      onEdit={handleEdit}
                      onApprove={handleApprove}
                      approved={!!approved[p]}
                    />
                  ))}
                </div>

                {approvedCount > 0 && (
                  <div style={{
                    marginTop: 16, padding: 14, background: "#0a1220",
                    border: "1px solid #1a2838",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ color: "#6a8a9a", fontSize: 10, letterSpacing: 1, display: "block", marginBottom: 4 }}>
                        SCHEDULE DAY
                      </label>
                      <select
                        value={scheduleDay}
                        onChange={e => setScheduleDay(e.target.value)}
                        style={{
                          background: "#080c14", color: "#e0f0f8",
                          border: "1px solid #1a2838", padding: "4px 8px",
                          fontFamily: "'Share Tech Mono', monospace", fontSize: 12,
                          outline: "none",
                        }}
                      >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={addToQueue}
                      style={{
                        background: "#00ff8815", border: "1px solid #00ff8850",
                        color: "#00ff88", fontSize: 13,
                        fontFamily: "'Share Tech Mono', monospace",
                        padding: "8px 20px", cursor: "pointer", letterSpacing: 1,
                      }}
                    >
                      ADD {approvedCount} TO QUEUE →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {view === "queue" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: "#6a8a9a", fontSize: 11, letterSpacing: 1 }}>
                // WEEKLY QUEUE — {queue.length} POST{queue.length !== 1 ? "S" : ""}
              </span>
            </div>

            {queue.length === 0 ? (
              <div style={{
                padding: "40px 20px", textAlign: "center",
                color: "#4a6a7a", fontSize: 13,
              }}>
                Queue empty. Compose some posts first.
              </div>
            ) : (
              DAYS.map(day => queueByDay[day].length > 0 && (
                <div key={day} style={{ marginBottom: 16 }}>
                  <div style={{
                    color: "#6a8a9a", fontSize: 11, letterSpacing: 1,
                    padding: "4px 0", marginBottom: 4,
                    borderBottom: "1px solid #1a283840",
                  }}>
                    {day.toUpperCase()}
                  </div>
                  {queueByDay[day].map((item, i) => {
                    const globalIndex = queue.indexOf(item);
                    return (
                      <QueueItem
                        key={globalIndex}
                        item={item}
                        index={globalIndex}
                        onRemove={removeFromQueue}
                      />
                    );
                  })}
                </div>
              ))
            )}

            {queue.length > 0 && (
              <div style={{
                marginTop: 20, padding: 14, background: "#0a1220",
                border: "1px solid #1a2838", fontSize: 12, color: "#6a8a9a",
                lineHeight: 1.6,
              }}>
                <span style={{ color: "#ccaa22" }}>→</span> Copy each post into Buffer's queue at{" "}
                <span style={{ color: "#00ccff" }}>buffer.com</span>. Free plan: 3 channels, 10 posts each.
                Set your posting schedule there — the day assignments here are your guide.
              </div>
            )}

            <button
              onClick={() => setView("compose")}
              style={{
                ...btnStyle("#00ccff"), marginTop: 16,
                padding: "8px 20px",
              }}
            >
              ← compose more
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "6px 16px", background: "#080c14e0",
        borderTop: "1px solid #1a283840",
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "#2a4a5a",
        backdropFilter: "blur(8px)",
      }}>
        <span>AMA CONTENT QUEUE v1.0</span>
        <span>EVERGREEN STUDIOS — BUILD IN PUBLIC</span>
      </div>
    </div>
  );
}
