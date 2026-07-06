# Tasks Outside AI Capability

This document lists the tasks from the `PROJECT_ROADMAP.md` that require your manual action, as I (the AI) do not have the ability to create third-party accounts, generate real production API keys, or manage your physical deployment infrastructure.

## 1. Google Cloud Console Setup (For Social Login)
To make Google Social Login work in production, you must:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **YegnaFinder**.
3. Navigate to **APIs & Services > Credentials**.
4. Configure the **OAuth Consent Screen** (App name, support email, logo).
5. Create **OAuth 2.0 Client IDs** for your Frontend (Web application) and Mobile Apps (Android/iOS).
6. Copy the generated `Client ID` and place it in the backend `.env` file under `GOOGLE_CLIENT_ID`.

## 2. Real SMTP Credentials for Email OTP
I will configure the code to use standard SMTP via Nodemailer, but you must provide the real email credentials.
1. Create a business email (e.g., via Google Workspace, Zoho Mail, or AWS SES).
2. Obtain the SMTP host, port, username, and app password.
3. Place these credentials in the backend `.env` file under `SMTP_HOST`, `SMTP_USER`, etc.

## 3. SMS Gateway Registration (For Phone OTPs)
If you want to send OTPs via SMS (very important for Ethiopian users):
1. Register with an Ethiopian SMS aggregator (e.g., SMS-Ethiopia, Afrotie, or local telecom API).
2. Obtain your API Key or Sender ID.
3. You will need to implement the specific API call according to the provider's documentation.

## 4. Production Domain & Server Setup
1. Purchase a domain name (e.g., `yegnafinder.com`).
2. Rent a VPS or cloud server (AWS EC2, DigitalOcean Droplet, Linode).
3. Point your domain's DNS A-records to your server's IP address.
4. Follow the `DEPLOYMENT.md` guide I provided earlier to manually spin up the backend on that server.

## 5. Apple App Store & Google Play Store Publishing
I cannot publish apps to the stores for you. You will need to:
1. Create an Apple Developer account ($99/yr) and a Google Play Console account ($25).
2. Build the release binaries from your Flutter/React Native code.
3. Upload them, fill out store listings, and submit for review.
