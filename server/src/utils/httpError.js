// Throw this anywhere: throw new HttpError(404, "Service not found")
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
