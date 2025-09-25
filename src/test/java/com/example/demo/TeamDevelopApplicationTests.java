package com.example.teamdev;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import com.example.teamdev.testconfig.PostgresContainerSupport;

@SpringBootTest
@ActiveProfiles("test")
class TeamDevelopApplicationTests extends PostgresContainerSupport {

	@Test
	void contextLoads() {
	}

}
