
export const getAuthToken = () => {
  // We use HttpOnly cookies for security, so client-side JS cannot read the token.
  // APIs should read the token from the 'Cookie' header automatically sent by the browser.
  return null;
}
