package vn.odauday.stay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ODauDayStayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ODauDayStayApplication.class, args);
    }
}
