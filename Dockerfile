FROM eclipse-temurin:21-jdk
EXPOSE 8080
COPY backend/target/app.jar deutschBridgeApp.jar
ENTRYPOINT ["java", "-jar", "deutschBridgeApp.jar"]