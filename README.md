# Email-Assistant

An intelligent email productivity assistant that fetches emails, classifies them, summarizes content, extracts deadlines, integrates with Google Calendar, and sends daily digests and alerts via WhatsApp or Telegram. This project leverages a multi-agent architecture powered by LLMs to automate your email workflow.

## ⚠️ Caution: Live link is only accesible to test user as per google policy, feel free to contact me to be one of test user for this beta version. (thank you for understanding)


-----
<img width="1911" height="958" alt="image" src="https://github.com/user-attachments/assets/9d49311e-4933-4ef2-9f0f-5102314f81e6" />



# Alert
<img width="1908" height="960" alt="image" src="https://github.com/user-attachments/assets/7f7d948d-bc68-4a76-9ad9-a292ad10af63" />




# Test Alert and Summary Message
<img width="1178" height="981" alt="image" src="https://github.com/user-attachments/assets/2f593aad-bb28-416d-a6cf-855c2856131d" />




## ✨ Features

  - 📧 **Automatic Email Fetching**: Connects securely to your Gmail account using OAuth2 to fetch new emails.
  - 🏷️ **Smart Classification**: Categorizes emails into **Urgent**, **Important**, **FYI**, and **Spam** using a combination of rule-based logic and LLM context analysis.
  - ✍️ **AI-Powered Summarization**: Generates concise, one-line summaries for long emails.
  - 🗓️ **Deadline & Event Extraction**: Intelligently detects dates, times, and events from email content and automatically syncs them to your Google Calendar.
  - 📲 **WhatsApp & Telegram Alerts**: Sends real-time alerts for upcoming deadlines and a curated daily digest of important emails.
  - 🧠 **Context-Aware RAG**: Uses Retrieval-Augmented Generation (RAG) with a Pinecone vector database to provide context from past emails for better summaries and suggested replies.
  - 🖥️ **Interactive Dashboard**: A clean user interface built with React to view categorized emails, summaries, upcoming events, and digest history.

-----

## 🛠️ Tech Stack

| Category      | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| **Backend**   | Node.js, Express.js                                           |
| **Frontend**  | React.js                                                      |
| **Database**  | MongoDB                                                       |
| **Vector DB** | Pinecone                                                      |
| **APIs**      | **Gmail API**, **Google Calendar API**, **Groq API**, **Hugging face** |
| **Messaging** | **WhatsApp API**, **Telegram Bot API**                        |
| **Deployment** | **AWS EC2, Nginx**  


-----

## 📂 Project Structure

The project is organized into a monorepo structure with a `backend` and `frontend` directory.

```
email-assistant/
├─ backend/
├─ frontend/

```
### Backend Structure
```

backend/
├─ agents/             # Individual agents for specific tasks
│  ├─ alertAgent.js
│  ├─ calendarAgent.js
│  ├─ classifierAgent.js
│  ├─ collectorAgent.js
│  ├─ deadlineAgent.js
│  ├─ digestAgent.js
│  ├─ ragAgent.js
│  └─ summarizerAgent.js
├─ db/                 # Schemas and database connectors
│  ├─ emailSchema.js
│  ├─ userSchema.js
│  ├─ schedularState.js
│  └─ whatsAppDigestSchema.js
├─ routes/
    ├─scheduler.js 
├─ utils/              # Utility functions
    ├─ sendTelegram,js
    ├─ sendWhatsApp
├─ utils/              
├─ app.js              # Express app entry point
├─ scheduler.js        # Cron / agenda scheduler
├─ googleClient.js     # Google OAuth client setup
├─ demoScheduler.js    # Demo/testing scheduler
└─ dummyTelegramBot.js # Telegram bot integration

```
### Backend Structure
```

frontend/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ AlertsPanel.jsx
│  │  ├─ DigestHistory.jsx
│  │  ├─ EmailCard.jsx
│  │  ├─ Inbox.jsx
│  │  ├─ LandingPage.jsx
│  │  ├─ Settings.jsx
│  │  └─ Sidebar.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ index.css
│  └─ App.css
├─ public/
├─ .env
├─ vite.config.js
└─ tailwind.config.js

```

-----

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

  - **Node.js** (v18 or higher)
  - **npm** or **yarn**
  - **MongoDB** instance (local or cloud like MongoDB Atlas)
  - **Google Cloud Project** with Gmail API and Google Calendar API enabled.
  - **Groq**  API Key.
  - **HF_TOKEN** Hugginface Access token.
  - **Pinecone** API Key and Index.
  - **Telegram Bot Token** and **Chat ID**.

### Backend Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/arnab-iitkgp/email-assistant.git
    cd email-assistant/backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example file and fill in your credentials.

    ```bash
    cp .env.example .env
    ```

    See the [Environment Variables](https://www.google.com/search?q=%23-environment-variables) section below for details on each key.

4.  **Run the backend server:**

    ```bash
    npm run dev
    ```

    The server will start, typically on port 5000.

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file and specify the backend URL.

    ```bash
    echo "VITE_BACKEND_URL=http://localhost:5000" > .env
    ```

4.  **Start the frontend development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

-----

## 🔑 Environment Variables

### Backend (`.env`)

Your `backend/.env` file should contain the following keys:

```ini
# --- Database ---
MONGODB_URI="your_mongodb_connection_string"
PORT=5000

# --- Google OAuth ---
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/auth/google/callback" # Must match your GCP settings

# --- AI & Vector DB ---
GEMINI_API_KEY="your_gemini_api_key"
PINECONE_INDEX="your_pinecone_index_name"
PINECONE_API_KEY="your_pinecone_api_key"

# --- Messaging ---
# For personal use
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_personal_chat_id"
# Optional: For paid Meta API
# WHATSAPP_API_TOKEN= "your_whatsapp_access_token"
# WHATSAPP_PHONE_NUMBER_ID="your_business_phone_id"  # from this number you will receive message
# WHATSAPP_TEST_NUMBER= "your_test_mobile_no"        # optional

# --- General ---
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### Frontend (`.env`)

Your `frontend/.env` file only needs one key:

```ini
VITE_BACKEND_URL="http://localhost:5000"
```

-----

## ⚙️ How It Works: The Agent Pipeline

The application operates through a sequence of autonomous agents managed by a scheduler.

1.  **Collector Agent**: Runs periodically to fetch new, unread emails from the user's Gmail inbox.
2.  **Classifier Agent**: Takes each new email and assigns it a category (e.g., *Urgent*).
3.  **Summarizer Agent**: Uses an LLM to generate a one-line summary.
4.  **Deadline Agent**: Scans the email for any potential deadlines or events.
5.  **Calendar Agent**: If a deadline is found, it creates an event in the user's Google Calendar.
6.  **RAG Agent**: Creates vector embeddings of the email and stores them in Pinecone for future context retrieval.
7.  **Digest & Alert Agents**: Collect all processed information for the day to compile a daily summary and send immediate alerts for urgent items.

This entire workflow is orchestrated by the `scheduler.js` file, which ensures agents run in the correct order and at the right time.

-----

## 🎮 Usage

1.  **Authentication**: Navigate to the frontend URL. You will be prompted to log in and authorize the application to access your Gmail and Google Calendar.
2.  **Dashboard**: Once authenticated, you will see your main dashboard, which displays categorized emails.
3.  **Automatic Processing**: The backend scheduler will run automatically. You don't need to do anything to fetch or process emails.
4.  **Receive Notifications**: Check your WhatsApp or Telegram for alerts and the daily digest at the scheduled time (e.g., 8 PM).
5.  **Check Your Calendar**: Any deadlines or events extracted from emails will appear automatically in your connected Google Calendar.

-----

## 🔮 Future Enhancements

  - [ ] **Multi-User Support**: Onboard multiple users with separate accounts and credentials.
  - [ ] **Official WhatsApp Business API**: Integrate with the official Meta API for robust, multi-recipient messaging.
  - [ ] **AI-Powered Suggested Replies**: Generate draft replies based on the email content and context from past conversations.
  - [ ] **Advanced NLP**: Improve deadline extraction with more sophisticated NLP models to handle complex date/time descriptions.
  - [ ] **Mobile-Friendly UI**: A fully responsive dashboard for a seamless experience on mobile devices.

-----

## 🤝 Contributing

Contributions are welcome\! If you have suggestions for improving the project, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

-----

## 📜 License

Distributed under the MIT License. See `LICENSE.txt` for more information.

Made with ❤️ by Arnab Chakraborty
