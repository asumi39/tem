import { NextResponse } from "next/server";

import { UnauthenticatedError } from "@/src/auth/current-user";
import { StudentForbiddenError, StudentResourceNotFoundError } from "@/src/shared/student-errors";

export function studentJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function isUnauthenticatedError(error: unknown): boolean {
  return (
    error instanceof UnauthenticatedError ||
    (error instanceof Error && /unauthenticated/i.test(error.message))
  );
}

export function isAuthorizationError(error: unknown): boolean {
  return (
    error instanceof StudentForbiddenError ||
    (error instanceof Error && /student access required/i.test(error.message))
  );
}

export function studentErrorResponse(error: unknown) {
  if (isUnauthenticatedError(error)) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (error instanceof StudentResourceNotFoundError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isAuthorizationError(error)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (error instanceof Error && /results are only available after submission/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof Error && /only in-progress attempts/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
