FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml .
COPY common-events/pom.xml common-events/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY ingestion-service/pom.xml ingestion-service/pom.xml
COPY analytics-service/pom.xml analytics-service/pom.xml
RUN mvn -B -pl api-gateway -am dependency:go-offline

COPY api-gateway/src api-gateway/src
RUN mvn -B -pl api-gateway -am package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /build/api-gateway/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
