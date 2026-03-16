export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class ConflictError extends HttpError {
  constructor(message, details) {
    super(409, message, details);
  }
}

export class ValidationError extends HttpError {
  constructor(message, details) {
    super(422, message, details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
  }
}
