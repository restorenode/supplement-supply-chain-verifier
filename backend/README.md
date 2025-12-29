# Ethical Supplement Supply Chain Verifier (Backend)

## Setup

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and update values as needed.

## Run the app

```bash
python3 -m uvicorn app.main:app --reload
```

## Run tests

```bash
python3 -m pytest
```

If you have Homebrew Python/uvicorn installed on macOS, using `python3 -m ...` ensures the venv
site-packages are used instead of the system/Homebrew ones.
