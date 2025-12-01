const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchWithAuth(
  path,
  { method = "GET", body, getState, dispatch } = {}
) {
  const state = getState?.();
  const access = state?.user?.accessToken;
  const refresh = state?.user?.refreshToken;

  async function call(token) {
    const res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  let res = await call(access);
  if (res.status !== 401) return res;

  if (!refresh) return res;
  const rr = await fetch(API_URL + "/users/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
   if (!rr.ok) {
       try {
         const { logout } = await import('../reducers/user');
         const { clearCart } = await import('../reducers/shop');
         dispatch?.(clearCart());
         localStorage.removeItem('guestCart');
         dispatch?.(logout());
       } catch {}
       return res;
     }

  const rrData = await rr.json();
  if (rrData?.accessToken) {
    const { setAccessToken } = await import("../reducers/user");
    dispatch?.(setAccessToken(rrData.accessToken));
    res = await call(rrData.accessToken);
  }
  return res;
}