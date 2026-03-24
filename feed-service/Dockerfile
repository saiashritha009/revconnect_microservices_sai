FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY feed-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
