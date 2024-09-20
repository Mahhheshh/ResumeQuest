# ResumeQuest

Welcome to **ResumeQuest**, a project aimed at generate interview questions based on candidates resume.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [License](#license)

## Introduction

ResumeQuest analyzes the content of a resume and generates relevant interview questions to help candidates prepare effectively. By focusing on the key skills and experiences listed, ResumeQuest ensures that users are well-prepared for their interviews.

## Features

- Upload resumes in PDF format
- Generate questions using the Gemini 1.5 Flash model
- Download the questions and answers in PDF format

## Installation

## Installing via Docker

1. Clone the repository:
    ```sh
    git clone https://github.com/Mahhheshh/ResumeQuest.git
    ```
2. Navigate to the project directory:
    ```sh
    cd ResumeQuest
    ```
3. Copy the example environment file to `.env`:
    ```sh
    cp backend/.env.example backend/.env
    ```
4. Update the `GEMINI_API_KEY` in the `.env` file.
5. Build the Docker image:
    ```sh
    docker build -t resumequest:0.0.1 .
    ```
6. Run the Docker container:
    ```sh
    docker run -p 5000:5000 --env-file backend/.env --rm resumequest:0.0.1
    ```

### Manual Installation

To install ResumeQuest, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/Mahhheshh/ResumeQuest.git
    ```
2. Navigate to the project directory:
    ```sh
    cd ResumeQuest
    ```
3. Install the frontend dependencies:
    ```sh
    cd frontend && npm install
    ```
4. Start the frontend:
    ```sh
    npm run dev
    ```
5. Open another terminal and install the backend dependencies:
    ```sh
    # macos/linux
    cd backend && pip3 install -r requirements.txt
    # windows
    cd backend && pip install -r requirements.txt
    ```
6. Copy the example environment file to `.env`:
    ```sh
    cp .env.example .env
    ```
7. Update the `GEMINI_API_KEY` in the `.env` file.
8. Run the backend:
    ```sh
    # Working directory is /backend
    # macOS/Linux
    python3 main.py

    # Windows
    python main.py
    ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
