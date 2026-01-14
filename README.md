# Vonage OTP Call System V2

A complete Vonage-based call system with OTP verification, advanced call flows, and real-time monitoring.

## Features

- Simple & Advanced call initiation
- Multi-step DTMF collection
- Real-time call monitoring via WebSocket
- Call analytics dashboard
- Database-backed state management (no memory issues)
- Multi-language support (English/Spanish)
- Recording capabilities

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 2. Vonage Private Key

Place your Vonage private key in `backend/private.key`

### 3. Deploy to Fly.io
```bash
fly launch --no-deploy
fly secrets set VONAGE_API_KEY=xxx VONAGE_API_SECRET=xxx VONAGE_APPLICATION_ID=xxx VONAGE_PHONE_NUMBER=xxx BASE_URL=https://your-app.fly.dev JWT_SECRET=xxx
fly deploy
```

### 4. Configure Vonage Webhooks

In your Vonage dashboard, set:
- Answer URL: `https://your-app.fly.dev/api/advanced-calls/answer/{call_uuid}`
- Event URL: `https://your-app.fly.dev/webhooks/event`

## Usage

1. Login with username: `admin`, password: `admin`
2. Use "Initiate Call" for simple calls
3. Use "Advanced Calls" for multi-step OTP flows
4. Monitor calls in real-time on dashboard

## Default OTP Flow

The system comes with a pre-configured 6-digit OTP verification flow.

## License

MIT
# vonage-call-system-v2
