import { delay, HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import { login } from "@/features/auth/api/login";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  toEmployeeApiErrorResponse,
} from "@/features/employees/api";
import { schemas } from "@/schemas/api";
import { ApiError } from "@/shared/api/errors/ApiError";
import { authEvents } from "@/shared/api/events/authEvents";
import { mswServer } from "@/test/msw/server";

describe("API integration via MSW", () => {
  it("handles successful login flow", async () => {
    const payload = { email: "user@example.com", password: "password" };
    const responseBody = {
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: payload.email,
        admin: false,
      },
    } satisfies z.infer<typeof schemas.LoginResponse>;

    mswServer.use(
      http.post(/\/api\/auth\/login$/, async ({ request }) => {
        const body = (await request.json()) as typeof payload;
        expect(body).toEqual(payload);
        return HttpResponse.json(responseBody, { status: 200 });
      })
    );

    const response = await login(payload);
    expect(() => schemas.LoginResponse.parse(response)).not.toThrow();
    expect(response.employee).toMatchObject({ id: 1, email: payload.email });
  });

  it("emits unauthorized event and throws ApiError on 401 response", async () => {
    mswServer.use(
      http.get(/\/api\/employees$/, () =>
        HttpResponse.json(
          { message: "Authentication required", code: "UNAUTHORIZED" },
          { status: 401 }
        )
      )
    );

    const unauthorizedSpy = vi.spyOn(authEvents, "emitUnauthorized");

    await expect(fetchEmployees()).rejects.toBeInstanceOf(ApiError);

    expect(unauthorizedSpy).toHaveBeenCalledWith("Authentication required");
    unauthorizedSpy.mockRestore();
  });

  it("returns trimmed query parameters for employee list", async () => {
    const query = { search: "  管理者 ", page: 2, size: 25 };
    const responseBody = {
      employees: [
        {
          id: 99,
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          admin: true,
        },
      ],
    } satisfies z.infer<typeof schemas.EmployeeListResponse>;

    mswServer.use(
      http.get(/\/api\/employees$/, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("search")).toBe("管理者");
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("size")).toBe("25");
        return HttpResponse.json(responseBody);
      })
    );

    const employees = await fetchEmployees(query);
    expect(() => schemas.EmployeeListResponse.parse(employees)).not.toThrow();
    expect(employees.employees).toHaveLength(1);
  });

  it("normalizes field errors for duplicate email", async () => {
    const payload = {
      firstName: "Hanako",
      lastName: "Suzuki",
      email: "hanako@example.com",
      password: "secret",
      admin: false,
    };

    mswServer.use(
      http.post(/\/api\/employees$/, async () =>
        HttpResponse.json(
          {
            message: "Email already exists",
            code: "DUPLICATE_EMAIL",
            fieldErrors: {
              email: ["メールアドレスは既に使用されています"],
            },
          },
          { status: 409 }
        )
      )
    );

    await expect(createEmployee(payload)).rejects.toBeInstanceOf(ApiError);

    try {
      await createEmployee(payload);
    } catch (error) {
      const apiError = error as ApiError;
      const normalized = toEmployeeApiErrorResponse(apiError);
      expect(normalized.fieldErrors?.["email"]?.[0]).toBe(
        "メールアドレスは既に使用されています"
      );
      expect(normalized.code).toBe("DUPLICATE_EMAIL");
    }
  });

  it("retries deleteEmployee until server succeeds", async () => {
    let attempt = 0;

    mswServer.use(
      http.delete(/\/api\/employees$/, async () => {
        attempt += 1;
        if (attempt < 3) {
          return HttpResponse.json(
            { message: "Temporary failure" },
            { status: 503 }
          );
        }
        await delay(5);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(deleteEmployee([1, 2, 3])).resolves.toBeUndefined();
    expect(attempt).toBe(3);
  });
});
