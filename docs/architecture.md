# SwasthyaScan Architecture

## Product

SwasthyaScan — Clinic Sahayata in your pocket.

## Core Journey

SCREEN → UNDERSTAND → TRACK → CONNECT

## Applications

### Patient
- Health screening
- Report understanding
- Prescription understanding
- Health Passport
- Consent management

### Community Health Worker / ASHA
- Patient lookup
- Consented health history
- Follow-up queue
- Referral tracking

## Architecture

Frontend: Next.js + TypeScript + Tailwind CSS

Backend: FastAPI + Python

Database: PostgreSQL / Supabase

Storage: Supabase Storage

ML: PyTorch + OpenCV + scikit-learn

Offline: PWA + IndexedDB

## Authentication

Supabase Auth

Public registration:
- Patient only

ASHA accounts:
- Provisioned/approved separately

## Authorization

PostgreSQL Row Level Security

Patients:
- Own profile
- Own screenings
- Own reports
- Own prescriptions
- Own consent settings

Community health workers:
- Only assigned patients
- Only when active consent exists
- Access limited by consent scope
