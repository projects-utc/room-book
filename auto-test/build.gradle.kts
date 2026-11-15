plugins {
    java
}

group = "vn.odauday"
version = "1.0.0"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.3")
    testImplementation("com.microsoft.playwright:playwright:1.48.0")
    testImplementation("com.fasterxml.jackson.core:jackson-databind:2.17.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.10.3")
}

tasks.withType<Test> {
    useJUnitPlatform()
    environment("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1")
    listOf("beUrl", "feUrl", "headless", "slowMo").forEach { prop ->
        System.getProperty(prop)?.let { systemProperty(prop, it) }
    }
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = false
    }
}

