/**
 * Centralized auth helpers.
 * Keys match what LoginPage.jsx actually stores on successful login:
 *   localStorage.setItem("userToken", response.data.token)
 *   localStorage.setItem("userData", JSON.stringify(response.data.user))
 */

const TOKEN_KEY = "userToken";
const USER_KEY = "userData";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
