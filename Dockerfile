# Stage 1: Build the application
FROM gradle:8.14.2-jdk21-jammy AS build

WORKDIR /app

# Copy gradle wrapper and build files first for better caching
COPY --chown=gradle:gradle gradle/ gradle/
COPY --chown=gradle:gradle gradlew build.gradle settings.gradle ./

# Copy frontend dependency manifests for caching
COPY --chown=gradle:gradle frontend/package.json frontend/package-lock.json frontend/

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY --chown=gradle:gradle src/ src/
COPY --chown=gradle:gradle frontend/ frontend/

# Build application
RUN ./gradlew clean build -x test --no-daemon

# Stage 2: Run the application
FROM temurin:21-jre-alpine

# Install security updates and create non-root user
RUN apk --no-cache upgrade && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy JAR file
COPY --from=build --chown=appuser:appgroup /app/build/libs/*.jar app.jar

# Switch to non-root user
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

# Use exec form and add JVM optimization
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseG1GC", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
