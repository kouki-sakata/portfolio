package com.example.teamdev.service.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.example.teamdev.constant.AppConstants;
import com.example.teamdev.entity.Employee;
import com.example.teamdev.service.EmployeeQueryService;
import com.example.teamdev.service.profile.model.ProfileActivityPage;
import com.example.teamdev.service.profile.model.ProfileActivityQuery;
import com.example.teamdev.service.profile.model.ProfileAggregate;
import com.example.teamdev.service.profile.model.ProfileChangeSet;
import com.example.teamdev.service.profile.model.ProfileMetadataDocument;
import com.example.teamdev.service.profile.model.ProfileMetadataUpdateCommand;
import com.example.teamdev.service.profile.model.ProfileWorkScheduleDocument;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.Collections;
import java.util.Locale;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileAppService")
class ProfileAppServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2025-11-04T03:00:00Z");

    @Mock
    private EmployeeQueryService employeeQueryService;

    @Mock
    private ProfileMetadataRepository metadataRepository;

    @Mock
    private ProfileActivityQueryService activityQueryService;

    @Mock
    private ProfileAuditService auditService;

    @Mock
    private Clock clock;

    @InjectMocks
    private ProfileAppService service;

    @Captor
    private ArgumentCaptor<ProfileMetadataDocument> metadataCaptor;

    @Captor
    private ArgumentCaptor<ProfileChangeSet> changeSetCaptor;

    @Captor
    private ArgumentCaptor<ProfileActivityQuery> queryCaptor;

    private Employee selfEmployee;
    private Employee adminOperator;
    private Employee targetEmployee;
    private ProfileMetadataDocument defaultMetadata;

    @BeforeEach
    void setUp() {
        selfEmployee = createEmployee(
            9000,
            "晃輝",
            "坂田",
            AppConstants.Employee.ADMIN_FLAG_GENERAL
        );
        adminOperator = createEmployee(
            7000,
            "太郎",
            "管理者",
            AppConstants.Employee.ADMIN_FLAG_ADMIN
        );
        targetEmployee = createEmployee(
            7001,
            "次郎",
            "従業員",
            AppConstants.Employee.ADMIN_FLAG_GENERAL
        );

        defaultMetadata = new ProfileMetadataDocument(
            "東京都千代田区丸の内1-1-1",
            "開発部",
            "EMP-7001",
            "既存の活動メモ",
            "東京/丸の内",
            "上長 一郎",
            "onsite",
            new ProfileWorkScheduleDocument("09:00", "18:00", 60),
            "active",
            "2024-04-01",
            "https://cdn.example.com/avatar.png"
        );

        lenient().when(clock.instant()).thenReturn(FIXED_INSTANT);
    }

    @Nested
    @DisplayName("loadSelfProfile")
    class LoadSelfProfile {
        @Test
        @DisplayName("従業員本人のプロフィールと監査ログを取得する")
        void loadSelfProfileRecordsViewEvent() {
            when(employeeQueryService.getById(selfEmployee.getId())).thenReturn(Optional.of(selfEmployee));
            when(metadataRepository.load(selfEmployee.getId())).thenReturn(defaultMetadata);

            ProfileAggregate aggregate = service.loadSelfProfile(selfEmployee.getId());

            assertThat(aggregate.employee().id()).isEqualTo(selfEmployee.getId());
            assertThat(aggregate.employee().fullName()).isEqualTo(
                String.format(Locale.JAPANESE, "%s %s", selfEmployee.getLastName(), selfEmployee.getFirstName())
            );
            assertThat(aggregate.metadata().department()).isEqualTo("開発部");

            verify(metadataRepository).load(selfEmployee.getId());
            verify(auditService).recordView(selfEmployee.getId(), selfEmployee.getId());
        }
    }

    @Nested
    @DisplayName("updateMetadata")
    class UpdateMetadata {
        @Test
        @DisplayName("変更されたフィールドのみが差分として記録される")
        void updateMetadataRecordsDiffAndSavesDocument() {
            when(employeeQueryService.getById(adminOperator.getId())).thenReturn(Optional.of(adminOperator));
            when(employeeQueryService.getById(targetEmployee.getId())).thenReturn(Optional.of(targetEmployee));
            when(metadataRepository.load(targetEmployee.getId())).thenReturn(defaultMetadata);

            ProfileMetadataUpdateCommand command = new ProfileMetadataUpdateCommand(
                null,
                "未来戦略部",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );

            ProfileAggregate result = service.updateMetadata(
                adminOperator.getId(),
                targetEmployee.getId(),
                command
            );

            verify(metadataRepository).save(eq(targetEmployee.getId()), metadataCaptor.capture(), any(Timestamp.class));
            ProfileMetadataDocument saved = metadataCaptor.getValue();
            assertThat(saved.department()).isEqualTo("未来戦略部");
            assertThat(saved.address()).isEqualTo(defaultMetadata.address());

            verify(auditService).recordUpdate(
                eq(adminOperator.getId()),
                eq(targetEmployee.getId()),
                changeSetCaptor.capture(),
                eq(FIXED_INSTANT)
            );

            ProfileChangeSet changeSet = changeSetCaptor.getValue();
            assertThat(changeSet.changedFields()).containsExactly("department");
            assertThat(changeSet.beforeSnapshot()).containsEntry("department", "開発部");
            assertThat(changeSet.afterSnapshot()).containsEntry("department", "未来戦略部");
            assertThat(changeSet.summary()).isEqualTo("departmentを更新");

            assertThat(result.metadata().department()).isEqualTo("未来戦略部");
            assertThat(result.employee().updatedAt()).isEqualTo("2025-11-04T03:00:00Z");
        }

        @Test
        @DisplayName("権限のない従業員が他人のプロフィールを更新しようとすると拒否される")
        void updateMetadataWithoutPermissionThrows() {
            when(employeeQueryService.getById(selfEmployee.getId())).thenReturn(Optional.of(selfEmployee));
            when(employeeQueryService.getById(targetEmployee.getId())).thenReturn(Optional.of(targetEmployee));

            ProfileMetadataUpdateCommand command = new ProfileMetadataUpdateCommand(
                null,
                "未来戦略部",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );

            assertThatThrownBy(() -> service.updateMetadata(
                selfEmployee.getId(),
                targetEmployee.getId(),
                command
            ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");

            verifyNoInteractions(metadataRepository);
            verifyNoInteractions(auditService);
        }
    }

    @Nested
    @DisplayName("listActivities")
    class ListActivities {
        @Test
        @DisplayName("クエリがnullの場合でもデフォルト条件で活動履歴を取得する")
        void listActivitiesUsesDefaultQueryWhenNull() {
            when(employeeQueryService.getById(selfEmployee.getId())).thenReturn(Optional.of(selfEmployee));
            ProfileActivityPage page = new ProfileActivityPage(0, 20, 0, 0, Collections.emptyList());
            when(activityQueryService.fetch(eq(selfEmployee.getId()), any(ProfileActivityQuery.class))).thenReturn(page);

            ProfileActivityPage result = service.listActivities(selfEmployee.getId(), selfEmployee.getId(), null);

            assertThat(result).isSameAs(page);
            verify(activityQueryService).fetch(eq(selfEmployee.getId()), queryCaptor.capture());

            ProfileActivityQuery query = queryCaptor.getValue();
            assertThat(query.page()).isEqualTo(0);
            assertThat(query.size()).isEqualTo(20);
            assertThat(query.from()).isEmpty();
            assertThat(query.to()).isEmpty();
        }
    }

    private Employee createEmployee(int id, String firstName, String lastName, int adminFlag) {
        return new Employee(
            id,
            firstName,
            lastName,
            String.format(Locale.ROOT, "%s.%s@example.com", firstName, lastName).toLowerCase(Locale.ROOT),
            "encoded-password",
            adminFlag,
            Timestamp.from(FIXED_INSTANT.minusSeconds(3600))
        );
    }
}
