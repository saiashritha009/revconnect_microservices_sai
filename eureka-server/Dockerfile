FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY eureka-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
