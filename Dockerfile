# Stage 1: Build the Spring Boot backend with Gradle
FROM gradle:8.8-jdk21-alpine AS builder
WORKDIR /app

# Copy build configuration and source code
COPY backend/build.gradle.kts backend/settings.gradle.kts ./
COPY backend/src ./src

# Build executable bootJar
RUN gradle bootJar --no-daemon -x test

# Stage 2: Run the application with lightweight JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Xmx384m -Dserver.port=${PORT:-8080} -jar app.jar"]
