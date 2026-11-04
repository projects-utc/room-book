# Stage 1: Build the Spring Boot backend with Gradle
FROM gradle:8.8-jdk21-alpine AS builder
WORKDIR /app

# Copy build configuration and source code
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src

# Build executable bootJar
RUN gradle bootJar --no-daemon -x test

# Stage 2: Run the application with lightweight JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

