export class StudentResourceNotFoundError extends Error {
  constructor(message = "Student resource not found") {
    super(message);
    this.name = "StudentResourceNotFoundError";
  }
}

export class StudentForbiddenError extends Error {
  constructor(message = "Student access required") {
    super(message);
    this.name = "StudentForbiddenError";
  }
}
