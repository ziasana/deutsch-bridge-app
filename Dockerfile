# Multi-stage build: Render (and most CI/PaaS builders) run `docker build` against a clean
# checkout with no pre-built jar, so the jar has to be built inside the image itself.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY backend/src src
RUN ./mvnw -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
# webp provides cwebp, used by WebpEncoder to re-encode admin-uploaded images
RUN apt-get update && apt-get install -y --no-install-recommends webp && rm -rf /var/lib/apt/lists/*
EXPOSE 8080
COPY --from=build /app/target/app.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
