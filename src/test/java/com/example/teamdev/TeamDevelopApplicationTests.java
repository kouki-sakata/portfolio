package com.example.teamdev;

import com.example.teamdev.testconfig.PostgresContainerSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class TeamDevelopApplicationTests extends PostgresContainerSupport {

    @Test
    void contextLoads() {
        // Application context should start without issues.
    }
}
