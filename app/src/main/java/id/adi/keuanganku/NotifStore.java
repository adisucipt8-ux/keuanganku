package id.adi.keuanganku;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Antrean transaksi dari notifikasi, disimpan di SharedPreferences sampai halaman aplikasi
 * mengambilnya. Juga menyimpan log notifikasi terakhir dan daftar aplikasi yang dipantau.
 */
public final class NotifStore {

    private static final String PREFS = "notif";
    private static final String K_PENDING = "pending";
    private static final String K_LOG = "log";
    private static final String K_SEEN = "seen";
    private static final String K_DETECTED = "detected";
    private static final String K_CONFIG = "config";

    static final String[] DEFAULT_PKGS = {"id.bmri.livin", "com.gojek.gopay", "com.gojek.app"};

    private NotifStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONArray arr(SharedPreferences p, String key) {
        try { return new JSONArray(p.getString(key, "[]")); } catch (JSONException e) { return new JSONArray(); }
    }

    private static JSONObject obj(SharedPreferences p, String key) {
        try { return new JSONObject(p.getString(key, "{}")); } catch (JSONException e) { return new JSONObject(); }
    }

    // ---- konfigurasi ----

    public static synchronized JSONObject config(Context c) {
        JSONObject cfg = obj(prefs(c), K_CONFIG);
        try {
            if (!cfg.has("enabled")) cfg.put("enabled", true);
            if (!cfg.has("pkgs")) {
                JSONArray a = new JSONArray();
                for (String s : DEFAULT_PKGS) a.put(s);
                cfg.put("pkgs", a);
            }
        } catch (JSONException ignored) { }
        return cfg;
    }

    public static synchronized void setConfig(Context c, String json) {
        try {
            JSONObject cfg = new JSONObject(json);
            prefs(c).edit().putString(K_CONFIG, cfg.toString()).apply();
        } catch (JSONException ignored) { }
    }

    public static boolean isWatched(Context c, String pkg) {
        JSONObject cfg = config(c);
        if (!cfg.optBoolean("enabled", true)) return false;
        JSONArray a = cfg.optJSONArray("pkgs");
        if (a == null) return false;
        for (int i = 0; i < a.length(); i++) if (pkg.equals(a.optString(i))) return true;
        return false;
    }

    // ---- aplikasi yang pernah mengirim notifikasi berisi nominal ----

    public static synchronized void noteDetected(Context c, String pkg, String label) {
        SharedPreferences p = prefs(c);
        JSONObject d = obj(p, K_DETECTED);
        try {
            JSONObject e = d.optJSONObject(pkg);
            if (e == null) e = new JSONObject();
            e.put("label", label);
            e.put("count", e.optInt("count", 0) + 1);
            e.put("last", System.currentTimeMillis());
            d.put(pkg, e);
            if (d.length() > 40) return; // cukup, jangan tumbuh tanpa batas
            p.edit().putString(K_DETECTED, d.toString()).apply();
        } catch (JSONException ignored) { }
    }

    public static synchronized String detected(Context c) {
        return obj(prefs(c), K_DETECTED).toString();
    }

    // ---- log notifikasi mentah (untuk dicek & menyetel pembaca) ----

    public static synchronized void log(Context c, JSONObject entry) {
        SharedPreferences p = prefs(c);
        JSONArray a = arr(p, K_LOG);
        JSONArray out = new JSONArray();
        out.put(entry);
        for (int i = 0; i < a.length() && out.length() < 40; i++) out.put(a.opt(i));
        p.edit().putString(K_LOG, out.toString()).apply();
    }

    public static synchronized String readLog(Context c) {
        return arr(prefs(c), K_LOG).toString();
    }

    public static synchronized void clearLog(Context c) {
        prefs(c).edit().putString(K_LOG, "[]").apply();
    }

    // ---- antrean transaksi ----

    /** @return false bila transaksi yang sama sudah pernah masuk antrean. */
    public static synchronized boolean addPending(Context c, String dedupKey, JSONObject tx) {
        SharedPreferences p = prefs(c);
        JSONArray seen = arr(p, K_SEEN);
        for (int i = 0; i < seen.length(); i++) if (dedupKey.equals(seen.optString(i))) return false;
        JSONArray newSeen = new JSONArray();
        newSeen.put(dedupKey);
        for (int i = 0; i < seen.length() && newSeen.length() < 300; i++) newSeen.put(seen.optString(i));
        JSONArray pending = arr(p, K_PENDING);
        if (pending.length() < 2000) pending.put(tx);
        p.edit().putString(K_SEEN, newSeen.toString()).putString(K_PENDING, pending.toString()).apply();
        return true;
    }

    public static synchronized String takePending(Context c) {
        SharedPreferences p = prefs(c);
        String s = p.getString(K_PENDING, "[]");
        p.edit().putString(K_PENDING, "[]").apply();
        return s;
    }

    public static synchronized int pendingCount(Context c) {
        return arr(prefs(c), K_PENDING).length();
    }
}
