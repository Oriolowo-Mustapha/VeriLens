# VeriLens — System Diagrams

> All diagrams below are derived from the actual codebase at [src/](file:///C:/Users/MUSTAPHA/Documents/Fake%20News%20Detection%20System/src).

---

## 1. System Architecture Diagram

High-level view of all system components, their layers, and external service integrations.

```mermaid
graph TB
    subgraph ClientLayer["Client Layer"]
        Browser["Web Browser<br/>(HTML / Tailwind CSS / JS)"]
    end

    subgraph ServerLayer["Application Server Layer (Node.js + Express 5)"]
        direction TB
        Entry["index.ts<br/>Express App Entry"]

        subgraph MW["Middleware"]
            CORS["CORS"]
            Auth_MW["auth.ts<br/>JWT Verification"]
            Admin_MW["admin.ts<br/>Role Guard"]
            Upload_MW["upload.ts<br/>Multer (5MB)"]
        end

        subgraph Routes["Route Layer"]
            AuthR["/api/auth/*"]
            AnalysisR["/api/analysis/*"]
            AdminR["/api/admin/*"]
        end

        subgraph Controllers["Controller Layer"]
            AuthC["auth.controller.ts"]
            AnalysisC["analysis.controller.ts"]
        end

        subgraph Services["Service Layer"]
            AnalysisS["analysis.service.ts<br/>(Orchestrator)"]
            AIS["ai.service.ts"]
            NewsS["news.service.ts"]
            RIS["reverseimage.service.ts"]
            MailS["mail.service.ts"]
        end

        subgraph Config["Configuration"]
            DB_Cfg["db.ts"]
            Cloud_Cfg["cloudinary.ts"]
        end

        subgraph Utils["Utilities"]
            Logger["logger.ts<br/>(Winston)"]
            KW["keywordExtractor.ts"]
        end
    end

    subgraph DataLayer["Data Layer"]
        MongoDB[("MongoDB<br/>Atlas / Local")]
    end

    subgraph ExternalAPIs["External Services"]
        OpenAI["OpenAI-Compatible API<br/>(GPT-4o-mini / Gemini 2.5 Flash)"]
        SerpAPI["SerpAPI<br/>(Google News Engine)"]
        Cloudinary["Cloudinary<br/>(Image CDN)"]
        Brevo["Brevo / Sendinblue<br/>(Transactional Email)"]
    end

    Browser -- "HTTPS Requests" --> Entry
    Entry --> CORS --> Routes
    AuthR --> AuthC
    AnalysisR -- "auth + upload" --> AnalysisC
    AdminR -- "auth + adminOnly" --> Controllers

    AuthC --> MailS
    AnalysisC --> AnalysisS

    AnalysisS --> AIS
    AnalysisS --> NewsS
    AnalysisS --> RIS
    AnalysisS --> Cloud_Cfg

    AIS --> OpenAI
    NewsS --> SerpAPI
    Cloud_Cfg --> Cloudinary
    MailS --> Brevo

    AuthC --> MongoDB
    AnalysisS --> MongoDB
    DB_Cfg --> MongoDB

    NewsS --> KW
    Entry --> Logger
```

---

## 2. Use Case Diagram

Actors and their interactions with the VeriLens system.

```mermaid
graph LR
    subgraph Actors
        User(("👤 User"))
        Admin(("🛡️ Admin"))
        AI(("🤖 AI Service"))
        EmailSvc(("✉️ Email Service"))
    end

    subgraph VeriLens["VeriLens System"]
        UC1["Register Account"]
        UC2["Verify Email"]
        UC3["Login"]
        UC4["Refresh Token"]
        UC5["Forgot Password"]
        UC6["Reset Password"]
        UC7["Submit News for Analysis"]
        UC8["Submit News + Image for Analysis"]
        UC9["View Analysis History"]
        UC10["View All Users"]
        UC11["Promote User to Admin"]
        UC12["Analyze Text with AI"]
        UC13["Search News Headlines"]
        UC14["Analyze Image with AI"]
        UC15["Reverse Image Search"]
        UC16["Upload Image to CDN"]
        UC17["Send Verification Email"]
        UC18["Send Password Reset Email"]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9

    Admin --> UC10
    Admin --> UC11

    UC7 -. "<<includes>>" .-> UC12
    UC7 -. "<<includes>>" .-> UC13
    UC8 -. "<<extends>>" .-> UC7
    UC8 -. "<<includes>>" .-> UC14
    UC8 -. "<<includes>>" .-> UC15
    UC8 -. "<<includes>>" .-> UC16

    UC1 -. "<<includes>>" .-> UC17
    UC5 -. "<<includes>>" .-> UC18

    UC12 --> AI
    UC14 --> AI
    UC17 --> EmailSvc
    UC18 --> EmailSvc
```

---

## 3. DFD Level 0 (Context Diagram)

The entire system as a single process with all external entities.

```mermaid
graph LR
    User(("👤 User"))
    Admin(("🛡️ Admin"))
    AIService(("🤖 AI API<br/>(OpenAI / Gemini)"))
    NewsAPI(("📰 SerpAPI"))
    CloudinarySvc(("☁️ Cloudinary"))
    EmailSvc(("✉️ Brevo"))
    DB[("💾 MongoDB")]

    User -- "Registration data,<br/>Login credentials,<br/>News text + optional image" --> VeriLens["0<br/>VeriLens<br/>System"]
    VeriLens -- "Auth tokens,<br/>Analysis results<br/>(verdict, confidence, explanation),<br/>Analysis history" --> User

    Admin -- "Admin credentials,<br/>User promotion requests" --> VeriLens
    VeriLens -- "User list,<br/>Promotion confirmation" --> Admin

    VeriLens -- "News claim + articles" --> AIService
    AIService -- "Verdict, confidence,<br/>explanation, sources" --> VeriLens

    VeriLens -- "Search keywords" --> NewsAPI
    NewsAPI -- "News headlines + snippets" --> VeriLens

    VeriLens -- "Image buffer" --> CloudinarySvc
    CloudinarySvc -- "Image URL" --> VeriLens

    VeriLens -- "Verification/reset emails" --> EmailSvc

    VeriLens -- "Read/Write User,<br/>Analysis documents" --> DB
    DB -- "Persisted records" --> VeriLens
```

---

## 4. DFD Level 1

Decomposition of the VeriLens system into its major internal processes.

```mermaid
graph TB
    User(("👤 User"))
    Admin(("🛡️ Admin"))
    AIAPI(("🤖 AI API"))
    NewsAPI(("📰 SerpAPI"))
    CloudSvc(("☁️ Cloudinary"))
    MailSvc(("✉️ Brevo"))
    UserStore[("D1: User Store")]
    AnalysisStore[("D2: Analysis Store")]

    User -- "Register / Login /<br/>Forgot Password" --> P1["1.0<br/>Authentication<br/>Management"]
    P1 -- "Tokens, User info" --> User
    P1 -- "Read / Write users" --> UserStore
    P1 -- "Send verification /<br/>reset email" --> P5["5.0<br/>Email<br/>Service"]
    P5 --> MailSvc

    User -- "News text + optional image" --> P2["2.0<br/>Analysis<br/>Orchestration"]
    P2 -- "Verdict, confidence,<br/>explanation" --> User

    P2 -- "Image buffer" --> P2A["2.1<br/>Image<br/>Upload"]
    P2A -- "Image URL" --> P2
    P2A --> CloudSvc

    P2 -- "Claim text" --> P3["3.0<br/>News Headline<br/>Search"]
    P3 -- "Headlines + snippets" --> P2
    P3 --> NewsAPI

    P2 -- "Claim + articles" --> P4A["4.1<br/>AI Text<br/>Analysis"]
    P4A -- "AI verdict" --> P2
    P4A --> AIAPI

    P2 -- "Text + Image URL" --> P4B["4.2<br/>AI Image<br/>Analysis"]
    P4B -- "Alignment score" --> P2
    P4B --> AIAPI

    P2 -- "Image URL" --> P4C["4.3<br/>Reverse Image<br/>Search (Stub)"]
    P4C -- "{ found: false }" --> P2

    P2 -- "Score aggregation /<br/>Save result" --> P6["6.0<br/>Scoring &<br/>Persistence"]
    P6 --> AnalysisStore

    User -- "Request history" --> P7["7.0<br/>History<br/>Retrieval"]
    P7 -- "Past analyses" --> User
    P7 --> AnalysisStore

    Admin -- "View users /<br/>Promote user" --> P8["8.0<br/>Admin<br/>Management"]
    P8 -- "User list /<br/>Updated user" --> Admin
    P8 --> UserStore
```

---

## 5. Activity Diagram

End-to-end flow for the **News Analysis** use case (the core feature).

```mermaid
flowchart TD
    Start(("●")) --> A["User submits news text<br/>(+ optional image)"]
    A --> B{"Is user<br/>authenticated?"}
    B -- "No" --> B1["Return 401 Unauthorized"]
    B1 --> End1(("●"))

    B -- "Yes" --> C{"Text content<br/>provided?"}
    C -- "No" --> C1["Return 400<br/>Bad Request"]
    C1 --> End2(("●"))

    C -- "Yes" --> D{"Image file<br/>attached?"}
    D -- "Yes" --> E["Upload image buffer<br/>to Cloudinary"]
    E --> F["Receive image URL"]
    D -- "No" --> G["Skip image processing"]

    F --> H["Extract keywords<br/>from claim text"]
    G --> H

    H --> I["Search news headlines<br/>via SerpAPI"]
    I --> J["Analyze text with AI<br/>(GPT-4o-mini → Gemini fallback)"]

    J --> K{"Image URL<br/>available?"}
    K -- "Yes" --> L["Analyze image-text alignment<br/>with AI (vision model)"]
    L --> L2["Reverse image search<br/>(stub: returns not found)"]
    K -- "No" --> M["Skip image analysis"]

    L2 --> N["Aggregate Prediction Score"]
    M --> N

    N --> N1{"Official fact-check<br/>overrides?"}
    N1 -- "Debunked" --> N2["Force verdict = FAKE<br/>Score capped at 10"]
    N1 -- "Confirmed" --> N3["Force verdict = REAL<br/>Score floored at 95"]
    N1 -- "None (current default)" --> N4{"AI verdict?"}

    N4 -- "FALSE" --> N5["Verdict = FAKE<br/>Score capped at 29"]
    N4 -- "UNVERIFIED" --> N6["Verdict = SUSPICIOUS<br/>Score capped at 64"]
    N4 -- "REAL & score ≥ 65" --> N7["Verdict = REAL"]
    N4 -- "Fallback" --> N8{"Final Score?"}

    N8 -- "< 30" --> N9["Verdict = FAKE"]
    N8 -- "30 – 64" --> N10["Verdict = SUSPICIOUS"]
    N8 -- "≥ 65" --> N11["Verdict = REAL"]

    N2 --> O["Save Analysis to MongoDB"]
    N3 --> O
    N5 --> O
    N6 --> O
    N7 --> O
    N9 --> O
    N10 --> O
    N11 --> O

    O --> P["Return result to user:<br/>verdict, confidence,<br/>explanation, sources"]
    P --> End3(("●"))
```

---

## 6. Entity-Relationship Diagram (ERD)

Database schema showing the two MongoDB collections and their relationship.

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String email UK "required, unique"
        String password "required, bcrypt hashed"
        String firstName "required"
        String lastName "required"
        String role "enum: user | admin, default: user"
        Boolean isVerified "default: false"
        String verificationToken "indexed"
        String refreshToken
        String resetPasswordToken "indexed"
        Date resetPasswordExpires
        Date createdAt "default: Date.now"
    }

    ANALYSIS {
        ObjectId _id PK
        ObjectId userId FK "ref: User"
        String content_text "required"
        String content_headline
        String content_imageUrl
        Number results_textModel_score "required"
        String results_textModel_label "required"
        Object results_textModel_rawResponse
        Number results_imageModel_alignmentScore
        Number results_imageModel_manipulationScore
        Object results_imageModel_rawResponse
        Number results_finalScore "required"
        String results_prediction "required, enum: Fake | Real | Suspicious"
        Array results_humanFactChecks "default: []"
        Array results_newsHeadlines "default: []"
        String results_breakdown_textAnalysis
        String results_breakdown_imageAnalysis
        String explanation
        Date createdAt "default: Date.now"
    }

    USER ||--o{ ANALYSIS : "submits"
```

---

## 7. Algorithm Flowchart

The **core scoring and prediction algorithm** from [analysis.service.ts](file:///C:/Users/MUSTAPHA/Documents/Fake%20News%20Detection%20System/src/Services/analysis.service.ts).

```mermaid
flowchart TD
    Start(("Start:<br/>aggregatePrediction()")) --> A["Receive inputs:<br/>• avgScore (AI text confidence)<br/>• imageAnalysis (alignment score | null)<br/>• official { debunk, confirm }<br/>• aiVerdict (AI result | null)"]

    A --> B{"Image analysis<br/>provided?"}
    B -- "Yes" --> C["finalScore =<br/>(avgScore × 0.6) + (alignmentScore × 0.4)"]
    B -- "No" --> D["finalScore = avgScore"]

    C --> E{"official.debunk<br/>= true?"}
    D --> E

    E -- "Yes" --> F["prediction = 'Fake'<br/>finalScore = min(finalScore, 10)"]
    F --> RETURN["Return { finalScore, prediction }"]

    E -- "No" --> G{"official.confirm<br/>= true?"}
    G -- "Yes" --> H["prediction = 'Real'<br/>finalScore = max(finalScore, 95)"]
    H --> RETURN

    G -- "No" --> I{"AI verdict<br/>available?"}

    I -- "Yes" --> J{"aiVerdict.verdict?"}

    J -- "'UNVERIFIED'" --> K["prediction = 'Suspicious'<br/>finalScore = min(finalScore, 64)"]
    K --> RETURN

    J -- "'FALSE'" --> L["prediction = 'Fake'<br/>finalScore = min(finalScore, 29)"]
    L --> RETURN

    J -- "'REAL'" --> M{"finalScore ≥ 65?"}
    M -- "Yes" --> N["prediction = 'Real'"]
    N --> RETURN
    M -- "No" --> O["Fall through to<br/>score-based logic"]

    J -- "Other / 'SUSPICIOUS'" --> O

    I -- "No" --> O

    O --> P{"finalScore < 30?"}
    P -- "Yes" --> Q["prediction = 'Fake'"]
    Q --> RETURN

    P -- "No" --> R{"finalScore ≥ 65?"}
    R -- "Yes" --> S["prediction = 'Real'"]
    S --> RETURN

    R -- "No" --> T["prediction = 'Suspicious'"]
    T --> RETURN
```

---

## Diagram Summary

| # | Diagram | Purpose |
|---|---------|---------|
| 1 | **System Architecture** | Shows all layers (Client → Middleware → Routes → Controllers → Services → DB) and external API integrations |
| 2 | **Use Case** | Maps actor interactions: User (auth, analysis, history), Admin (user management), AI & Email as supporting actors |
| 3 | **DFD Level 0** | Context diagram — VeriLens as a black box with all external entities and data flows |
| 4 | **DFD Level 1** | Decomposes the system into 8 internal processes with data stores and external entity connections |
| 5 | **Activity Diagram** | Step-by-step flow for the core news analysis feature, including all decision points |
| 6 | **ERD** | Two MongoDB collections (User, Analysis) with all fields, types, constraints, and the 1:N relationship |
| 7 | **Algorithm Flowchart** | The `aggregatePrediction()` scoring algorithm decision tree with exact thresholds (30/65) and override logic |

> [!NOTE]
> All diagrams use Mermaid syntax and can be rendered in any Mermaid-compatible viewer (GitHub, VS Code with Markdown Preview Mermaid extension, etc.).

> [!IMPORTANT]
> The **Reverse Image Search** service is currently a **stub** (always returns `{ found: false }`). The **Official Fact-Check** integration is **commented out** — `aggregatePrediction` always receives `{ debunk: false, confirm: false }`, making those branches dead code in the current implementation.
