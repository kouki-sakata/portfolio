# Stage 1: Build the application
FROM gradle:8.14.2-jdk21-jammy AS build
WORKDIR /app
COPY --chown=gradle:gradle . /app
RUN gradle clean build -x test

# Stage 2: Run the application
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
