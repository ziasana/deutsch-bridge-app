# DeutschBridge
![Java CI with Maven](https://github.com/ziasana/deutsch-bridge-app/actions/workflows/maven.yml/badge.svg)
![Frontend CI](https://github.com/ziasana/deutsch-bridge-app/actions/workflows/frontend.yml/badge.svg)
![SonarQube CI Backend](https://github.com/ziasana/deutsch-bridge-app/actions/workflows/sonar-backend.yml/badge.svg)
![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ziatest_deutsch-bridge-app&metric=coverage)

DeutschBridge is a full‑stack language‑learning platform that helps
learners improve their German skills through daily vocabulary,
personalized learning plans, grammar lessons, and progress tracking. It
integrates AI‑generated content, interactive exercises, and a clean user
experience to make consistent learning simple and effective.

`(It does not contain alll features but is under development)`
## ✨ Features

-   Daily AI‑generated vocabulary based on user level
-   Grammar lessons with clear explanations
-   Personal vocabulary list with review mode
-   Learning plan with daily idioms, advanced words, and
    Nomen‑Verb‑Verbindungen
-   User authentication and personalized progress tracking
-   Clean and responsive UI

## 🛠️ Technologies

**Frontend:** Next.js, React, TailwindCSS\
**Backend:** Spring Boot (Java)\
**Database:** PostgreSQL\
**AI Integration:** Ollama API\
**Other Tools:** GitHub Actions (CI), Docker, JWT Authentication, SonarQube

## 📦 Installation

``` bash
git clone https://github.com/your-username/deutschbridge.git
cd deutschbridge
```

### Backend

``` bash
cd backend
./mvnw spring-boot:run
```

### Frontend

``` bash
cd frontend
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License.
