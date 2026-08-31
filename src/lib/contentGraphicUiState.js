export function contentGraphicUiState(response = {}, eventId = "") {
  if (response?.status === "complete" && response?.imageUrl) {
    return {
      phase: "success",
      eventId: response.eventId || eventId,
      message: response.duplicate
        ? "The existing graphic for this content event was recovered."
        : "Your social graphic is ready.",
      fieldErrors: {},
      result: response,
      retryable: false,
    };
  }

  const requestId = String(response?.requestId || "").trim();
  const message = [
    response?.message || "Unable to generate the social graphic.",
    requestId ? `Request ID: ${requestId}` : "",
  ].filter(Boolean).join(" ");

  return {
    phase: "error",
    eventId: response?.eventId || eventId,
    message,
    fieldErrors: response?.fieldErrors || {},
    result: null,
    retryable: Boolean(response?.retryable),
  };
}
