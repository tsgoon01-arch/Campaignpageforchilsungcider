import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getUserFromToken(token: string) {
  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function getUserKey(userId: string | null, deviceId: string): string {
  return userId ? userId : `device:${deviceId}`;
}

/** Returns YYYY-MM-DD in KST (UTC+9) */
function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAILY_SPIN_LIMIT = 2;
const TSHIRT_STOCK_KEY = 'roulette:tshirt_remaining';
const TSHIRT_TOTAL = 50;

// Actual prizes (2 types only)
const ROULETTE_PRIZES = [
  {
    id: 'soda-1plus1',
    name: '칠성사이다 1+1 교환권',
    emoji: '🥤',
    description: '편의점 칠성사이다 1+1 교환권 (GS25·CU·세븐일레븐)',
    color: '#0057B8',
    weight: 90,
  },
  {
    id: 'tshirt',
    name: '한정판 티셔츠',
    emoji: '👕',
    description: '칠성사이다 × 김밥대장 콜라보 한정판 티셔츠 (50개 한정)',
    color: '#EF4444',
    weight: 10,
  },
];

interface SpinResult {
  prizeId: string;
  prizeName: string;
  prizeEmoji: string;
  prizeColor: string;
  storeId: string;
  storeName: string;
  timestamp: string;
  couponId?: string;
}

interface Coupon {
  couponId: string;
  prizeId: string;
  prizeName: string;
  prizeEmoji: string;
  prizeColor: string;
  storeId: string;
  storeName: string;
  isUsed: boolean;
  issuedAt: string;
  usedAt: string | null;
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/make-server-66d4cc36/health", (c) => c.json({ status: "ok" }));

// ── Auth: Sign Up ─────────────────────────────────────────────────────────────
app.post("/make-server-66d4cc36/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "이메일, 비밀번호, 이름을 모두 입력해주세요." }, 400);
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { name },
      email_confirm: true,
    });
    if (error) {
      console.log("Signup error:", error.message);
      if (error.message.includes("already registered")) {
        return c.json({ error: "이미 사용 중인 이메일입니다." }, 400);
      }
      return c.json({ error: `회원가입 오류: ${error.message}` }, 400);
    }
    await kv.set(`profile:${data.user.id}`, { name, email, createdAt: new Date().toISOString() });
    await kv.set(`stamps:${data.user.id}`, []);
    console.log("User created:", data.user.id);
    return c.json({ user: { id: data.user.id, email, name } });
  } catch (err) {
    console.log("Signup exception:", err);
    return c.json({ error: `서버 오류: ${err}` }, 500);
  }
});

// ── Auth: Social Login ────────────────────────────────────────────────────────
app.post("/make-server-66d4cc36/auth/social", async (c) => {
  try {
    const { provider, demoName } = await c.req.json();
    if (!provider || !['naver', 'kakao'].includes(provider)) {
      return c.json({ error: "지원하지 않는 소셜 로그인 제공자입니다." }, 400);
    }
    const supabase = getServiceClient();
    const demoEmail = `${provider}_demo_user@chilsung-stamptour.demo`;
    const demoPassword = `chilsung_${provider}_demo_2026!`;
    const displayName = demoName || (provider === 'naver' ? '네이버 유저' : '카카오 유저');

    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === demoEmail);
    let userId: string;

    if (existing) {
      userId = existing.id;
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { name: displayName, provider },
      });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: demoEmail, password: demoPassword,
        user_metadata: { name: displayName, provider },
        email_confirm: true,
      });
      if (error) return c.json({ error: `소셜 로그인 오류: ${error.message}` }, 400);
      userId = data.user.id;
      await kv.set(`stamps:${userId}`, []);
    }

    await kv.set(`profile:${userId}`, { name: displayName, email: demoEmail, provider, createdAt: new Date().toISOString() });

    const AUTH_URL = Deno.env.get("SUPABASE_URL") + "/auth/v1/token?grant_type=password";
    const signInRes = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": Deno.env.get("SUPABASE_ANON_KEY")! },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    });
    const signInData = await signInRes.json();
    if (!signInRes.ok || signInData.error) {
      return c.json({ error: `소셜 로그인 인증 오류: ${signInData.error_description || signInData.error}` }, 400);
    }

    console.log(`Social login success: ${provider}, user: ${userId}`);
    return c.json({
      access_token: signInData.access_token,
      user: { id: userId, email: demoEmail, user_metadata: { name: displayName, provider } },
    });
  } catch (err) {
    console.log("Social auth exception:", err);
    return c.json({ error: `서버 오류: ${err}` }, 500);
  }
});

// ── Stamps: Get ───────────────────────────────────────────────────────────────
app.get("/make-server-66d4cc36/stamps", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "인증이 필요합니다." }, 401);
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "유효하지 않은 토큰입니다." }, 401);

    const stamps: string[] = (await kv.get(`stamps:${user.id}`)) ?? [];
    const profile = await kv.get(`profile:${user.id}`);
    const tshirtEntry = await kv.get(`entry:tshirt77:${user.id}`);
    const korailEntry = await kv.get(`entry:korail:${user.id}`);

    return c.json({ stamps, profile, entries: { tshirt77: tshirtEntry ?? null, korail: korailEntry ?? null } });
  } catch (err) {
    console.log("Get stamps error:", err);
    return c.json({ error: `스탬프 조회 오류: ${err}` }, 500);
  }
});

// ── Stamps: Add ───────────────────────────────────────────────────────────────
app.post("/make-server-66d4cc36/stamps/add", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "인증이 필요합니다." }, 401);
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "유효하지 않은 토큰입니다." }, 401);

    const { storeId } = await c.req.json();
    if (!storeId) return c.json({ error: "storeId가 필요합니다." }, 400);

    const stamps: string[] = (await kv.get(`stamps:${user.id}`)) ?? [];
    let newEntry: string | null = null;

    if (!stamps.includes(storeId)) {
      stamps.push(storeId);
      await kv.set(`stamps:${user.id}`, stamps);
      const newCount = stamps.length;

      // 4번째 스탬프: 티셔츠 77명 추첨 응모권
      if (newCount === 4) {
        const existing = await kv.get(`entry:tshirt77:${user.id}`);
        if (!existing) {
          await kv.set(`entry:tshirt77:${user.id}`, {
            entryId: `tshirt77-${user.id}`, entryType: 'tshirt77',
            title: '한정판 티셔츠 77명 추첨 응모권', emoji: '👕',
            description: '칠성사이다 × 김밥대장 콜라보 한정판 티셔츠 77명 추첨',
            registeredAt: new Date().toISOString(),
          });
          newEntry = 'tshirt77';
        }
      }
      // 7번째 스탬프: 코레일 기차 여행권 추첨
      if (newCount === 7) {
        const existing = await kv.get(`entry:korail:${user.id}`);
        if (!existing) {
          await kv.set(`entry:korail:${user.id}`, {
            entryId: `korail-${user.id}`, entryType: 'korail',
            title: '코레일 기차 여행권 추첨 응모권', emoji: '🚂',
            description: '코레일 전국 기차 여행권 (KTX 포함) 추첨',
            registeredAt: new Date().toISOString(),
          });
          newEntry = 'korail';
        }
      }
    }

    const tshirtEntry = await kv.get(`entry:tshirt77:${user.id}`);
    const korailEntry = await kv.get(`entry:korail:${user.id}`);
    return c.json({ stamps, newEntry, entries: { tshirt77: tshirtEntry ?? null, korail: korailEntry ?? null } });
  } catch (err) {
    console.log("Add stamp error:", err);
    return c.json({ error: `스탬프 추가 오류: ${err}` }, 500);
  }
});

// ── Stamps: Reset ─────────────────────────────────────────────────────────────
app.post("/make-server-66d4cc36/stamps/reset", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "인증이 필요합니다." }, 401);
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "유효하지 않은 토큰입니다." }, 401);

    await kv.set(`stamps:${user.id}`, []);
    await kv.del(`entry:tshirt77:${user.id}`);
    await kv.del(`entry:korail:${user.id}`);

    return c.json({ stamps: [], entries: { tshirt77: null, korail: null } });
  } catch (err) {
    console.log("Reset stamps error:", err);
    return c.json({ error: `스탬프 초기화 오류: ${err}` }, 500);
  }
});

// ── Roulette: Stock ───────────────────────────────────────────────────────────
app.get("/make-server-66d4cc36/roulette/stock", async (c) => {
  try {
    const remaining = (await kv.get(TSHIRT_STOCK_KEY)) ?? TSHIRT_TOTAL;
    return c.json({ tshirt_remaining: remaining, tshirt_total: TSHIRT_TOTAL });
  } catch (err) {
    return c.json({ error: `재고 조회 오류: ${err}` }, 500);
  }
});

// ── Roulette: Check (spins today for this store) ──────────────────────────────
app.get("/make-server-66d4cc36/roulette/check", async (c) => {
  try {
    const storeId = c.req.query('storeId') || 'unknown';
    const deviceId = c.req.query('deviceId') || 'unknown';
    const token = c.req.header("Authorization")?.split(" ")[1];

    let userId: string | null = null;
    if (token) {
      const user = await getUserFromToken(token);
      userId = user?.id || null;
    }

    const userKey = getUserKey(userId, deviceId);
    const today = getTodayKST();
    const dailyKey = `roulette:daily:${userKey}:${storeId}:${today}`;
    const todayResults: SpinResult[] = (await kv.get(dailyKey)) ?? [];
    const spinsToday = todayResults.length;

    return c.json({
      spinsToday,
      maxSpins: DAILY_SPIN_LIMIT,
      canSpin: spinsToday < DAILY_SPIN_LIMIT,
      todayResults,
    });
  } catch (err) {
    console.log("Roulette check error:", err);
    return c.json({ spinsToday: 0, maxSpins: DAILY_SPIN_LIMIT, canSpin: true, todayResults: [] });
  }
});

// ── Roulette: Spin ────────────────────────────────────────────────────────────
app.post("/make-server-66d4cc36/roulette/spin", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const storeId = body.storeId || 'unknown';
    const storeName = body.storeName || '매장';
    const deviceId = body.deviceId || 'unknown';
    const token = c.req.header("Authorization")?.split(" ")[1];

    let userId: string | null = null;
    if (token) {
      const user = await getUserFromToken(token);
      userId = user?.id || null;
    }

    const userKey = getUserKey(userId, deviceId);
    const today = getTodayKST();
    const dailyKey = `roulette:daily:${userKey}:${storeId}:${today}`;

    // ── 하루 2회 제한 (서버사이드) ──
    const todayResults: SpinResult[] = (await kv.get(dailyKey)) ?? [];
    if (todayResults.length >= DAILY_SPIN_LIMIT) {
      return c.json({
        error: `오늘은 이미 ${DAILY_SPIN_LIMIT}번 참여하셨습니다. 내일 다시 도전해주세요! 🙏`,
        spinsToday: todayResults.length,
        maxSpins: DAILY_SPIN_LIMIT,
      }, 400);
    }

    // ── 재고 확인 ──
    let tshirtRemaining: number = (await kv.get(TSHIRT_STOCK_KEY)) ?? TSHIRT_TOTAL;

    // ── 가중치 기반 뽑기 ──
    const pool: typeof ROULETTE_PRIZES[0][] = [];
    for (const prize of ROULETTE_PRIZES) {
      if (prize.id === 'tshirt' && tshirtRemaining <= 0) continue;
      for (let i = 0; i < prize.weight; i++) pool.push(prize);
    }
    const winner = pool[Math.floor(Math.random() * pool.length)];

    if (winner.id === 'tshirt') {
      tshirtRemaining = Math.max(0, tshirtRemaining - 1);
      await kv.set(TSHIRT_STOCK_KEY, tshirtRemaining);
    }

    const timestamp = new Date().toISOString();
    const couponId = generateId();

    // ── Daily record ──
    const spinResult: SpinResult = {
      prizeId: winner.id, prizeName: winner.name, prizeEmoji: winner.emoji, prizeColor: winner.color,
      storeId, storeName, timestamp, couponId,
    };
    todayResults.push(spinResult);
    await kv.set(dailyKey, todayResults);

    // ── Global history ──
    const historyKey = `roulette:history:${userKey}`;
    const history: object[] = (await kv.get(historyKey)) ?? [];
    history.unshift({ ...spinResult });
    if (history.length > 200) history.splice(200);
    await kv.set(historyKey, history);

    // ── 로그인 사용자: 쿠폰 즉시 발급 ──
    let couponIssued = false;
    if (userId) {
      const coupons: Coupon[] = (await kv.get(`coupons:${userId}`)) ?? [];
      coupons.unshift({
        couponId, prizeId: winner.id, prizeName: winner.name, prizeEmoji: winner.emoji, prizeColor: winner.color,
        storeId, storeName, isUsed: false, issuedAt: timestamp, usedAt: null,
      });
      await kv.set(`coupons:${userId}`, coupons);
      couponIssued = true;
    }

    const spinsToday = todayResults.length;
    console.log(`Spin: userKey=${userKey}, store=${storeId}, prize=${winner.id}, spinsToday=${spinsToday}`);

    return c.json({
      prize: winner,
      couponId,
      couponIssued,
      tshirt_remaining: tshirtRemaining,
      spinsToday,
      maxSpins: DAILY_SPIN_LIMIT,
      canSpinAgain: spinsToday < DAILY_SPIN_LIMIT,
    });
  } catch (err) {
    console.log("Roulette spin error:", err);
    return c.json({ error: `룰렛 오류: ${err}` }, 500);
  }
});

// ── Roulette: History ─────────────────────────────────────────────────────────
app.get("/make-server-66d4cc36/roulette/history", async (c) => {
  try {
    const deviceId = c.req.query('deviceId') || 'unknown';
    const token = c.req.header("Authorization")?.split(" ")[1];
    let userId: string | null = null;
    if (token) {
      const user = await getUserFromToken(token);
      userId = user?.id || null;
    }
    const userKey = getUserKey(userId, deviceId);
    const history = (await kv.get(`roulette:history:${userKey}`)) ?? [];
    return c.json({ history });
  } catch (err) {
    return c.json({ history: [] });
  }
});

// ── Roulette: Coupons List ────────────────────────────────────────────────────
app.get("/make-server-66d4cc36/roulette/coupons", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ coupons: [] });
    const user = await getUserFromToken(token);
    if (!user) return c.json({ coupons: [] });

    const coupons: Coupon[] = (await kv.get(`coupons:${user.id}`)) ?? [];
    return c.json({ coupons });
  } catch (err) {
    console.log("Get coupons error:", err);
    return c.json({ coupons: [] });
  }
});

// ── Roulette: Use Coupon ──────────────────────────────────────────────────────
app.post("/make-server-66d4cc36/roulette/coupon/use", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "인증이 필요합니다." }, 401);
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "유효하지 않은 토큰입니다." }, 401);

    const { couponId } = await c.req.json();
    if (!couponId) return c.json({ error: "couponId가 필요합니다." }, 400);

    const coupons: Coupon[] = (await kv.get(`coupons:${user.id}`)) ?? [];
    const idx = coupons.findIndex((c) => c.couponId === couponId);

    if (idx === -1) return c.json({ error: "교환권을 찾을 수 없습니다." }, 404);
    if (coupons[idx].isUsed) return c.json({ error: "이미 사용된 교환권입니다." }, 400);

    coupons[idx].isUsed = true;
    coupons[idx].usedAt = new Date().toISOString();
    await kv.set(`coupons:${user.id}`, coupons);

    console.log(`Coupon used: ${couponId}, user: ${user.id}`);
    return c.json({ coupon: coupons[idx] });
  } catch (err) {
    console.log("Use coupon error:", err);
    return c.json({ error: `교환권 사용 오류: ${err}` }, 500);
  }
});

// ── Roulette: Claim Pending Prize (after login) ───────────────────────────────
app.post("/make-server-66d4cc36/roulette/claim", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "인증이 필요합니다." }, 401);
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "유효하지 않은 토큰입니다." }, 401);

    const body = await c.req.json();
    const { prizeId, prizeName, prizeEmoji, prizeColor, storeId, storeName, couponId, timestamp } = body;

    if (!prizeId || !couponId) return c.json({ error: "유효하지 않은 응모 데이터입니다." }, 400);

    // Check if coupon already exists (prevent double claim)
    const existing: Coupon[] = (await kv.get(`coupons:${user.id}`)) ?? [];
    if (existing.some((c) => c.couponId === couponId)) {
      return c.json({ coupon: existing.find((c) => c.couponId === couponId), alreadyClaimed: true });
    }

    const newCoupon: Coupon = {
      couponId, prizeId, prizeName, prizeEmoji, prizeColor,
      storeId: storeId || 'unknown', storeName: storeName || '매장',
      isUsed: false, issuedAt: timestamp || new Date().toISOString(), usedAt: null,
    };
    existing.unshift(newCoupon);
    await kv.set(`coupons:${user.id}`, existing);

    console.log(`Pending prize claimed: couponId=${couponId}, userId=${user.id}, prize=${prizeId}`);
    return c.json({ coupon: newCoupon });
  } catch (err) {
    console.log("Claim error:", err);
    return c.json({ error: `교환권 등록 오류: ${err}` }, 500);
  }
});

// ── Roulette: Tshirt Shipping Request ────────────────────────────────────────
app.post("/make-server-66d4cc36/roulette/coupon/shipping", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "인증이 필요합니다." }, 401);
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "유효하지 않은 토큰입니다." }, 401);

    const { couponId, name, phone, address, size } = await c.req.json();
    if (!couponId || !name || !phone || !address || !size) {
      return c.json({ error: "모든 배송 정보를 입력해주세요." }, 400);
    }

    // Verify coupon belongs to user and is tshirt type
    const coupons: Coupon[] = (await kv.get(`coupons:${user.id}`)) ?? [];
    const coupon = coupons.find((c) => c.couponId === couponId);
    if (!coupon) return c.json({ error: "교환권을 찾을 수 없습니다." }, 404);
    if (coupon.prizeId !== 'tshirt') return c.json({ error: "티셔츠 교환권이 아닙니다." }, 400);
    if (coupon.isUsed) return c.json({ error: "이미 사용된 교환권입니다." }, 400);

    // Check if shipping already requested
    const existingShipping = await kv.get(`shipping:${user.id}:${couponId}`);
    if (existingShipping) {
      return c.json({ error: "이미 배송 신청된 교환권입니다.", shipping: existingShipping }, 400);
    }

    const shippingData = {
      couponId, userId: user.id, name, phone, address, size,
      requestedAt: new Date().toISOString(), status: 'pending',
    };
    await kv.set(`shipping:${user.id}:${couponId}`, shippingData);

    // Mark coupon as used
    const idx = coupons.findIndex((c) => c.couponId === couponId);
    coupons[idx].isUsed = true;
    coupons[idx].usedAt = new Date().toISOString();
    await kv.set(`coupons:${user.id}`, coupons);

    console.log(`Tshirt shipping requested: couponId=${couponId}, userId=${user.id}, address=${address}`);
    return c.json({ shipping: shippingData, coupon: coupons[idx] });
  } catch (err) {
    console.log("Shipping request error:", err);
    return c.json({ error: `배송 신청 오류: ${err}` }, 500);
  }
});

// ── Roulette: Get Shipping Status ─────────────────────────────────────────────
app.get("/make-server-66d4cc36/roulette/coupon/shipping/:couponId", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ shipping: null });
    const user = await getUserFromToken(token);
    if (!user) return c.json({ shipping: null });

    const couponId = c.req.param('couponId');
    const shipping = await kv.get(`shipping:${user.id}:${couponId}`);
    return c.json({ shipping: shipping ?? null });
  } catch (err) {
    return c.json({ shipping: null });
  }
});

Deno.serve(app.fetch);