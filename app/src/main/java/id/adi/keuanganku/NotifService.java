package id.adi.keuanganku;

import android.app.Notification;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Locale;

/**
 * Membaca notifikasi pembayaran dari aplikasi yang dipilih (default: Livin' by Mandiri, GoPay, Gojek)
 * dan memasukkannya ke antrean. Tidak ada data yang dikirim keluar HP.
 */
public class NotifService extends NotificationListenerService {

    @Override
    public void onListenerConnected() {
        NotifStore.setConnected(this, System.currentTimeMillis());
        // ambil juga notifikasi yang masih ada di panel saat layanan (kembali) tersambung
        try {
            StatusBarNotification[] active = getActiveNotifications();
            if (active != null) for (StatusBarNotification sbn : active) onNotificationPosted(sbn);
        } catch (Throwable ignored) { }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            handle(sbn);
        } catch (Throwable ignored) {
            // jangan pernah membuat layanan berhenti karena satu notifikasi aneh
        }
    }

    private void handle(StatusBarNotification sbn) throws JSONException {
        String pkg = sbn.getPackageName();
        if (pkg == null || pkg.equals(getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null || n.extras == null) return;
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;

        NotifStore.setLastSeen(this, System.currentTimeMillis());
        Bundle e = n.extras;
        String title = str(e.getCharSequence(Notification.EXTRA_TITLE));
        String text = str(e.getCharSequence(Notification.EXTRA_TEXT));
        String big = str(e.getCharSequence(Notification.EXTRA_BIG_TEXT));
        CharSequence[] lines = e.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
        StringBuilder body = new StringBuilder(big.length() >= text.length() ? big : text);
        if (lines != null) {
            for (CharSequence l : lines) {
                if (l != null && body.indexOf(l.toString()) < 0) body.append('\n').append(l);
            }
        }
        String bodyStr = body.toString();
        String all = (title + " " + bodyStr).toLowerCase(Locale.ROOT);
        if (!all.contains("rp") && !all.contains("idr")) return;

        String label = appLabel(pkg);
        NotifStore.noteDetected(this, pkg, label);
        boolean watched = NotifStore.isWatched(this, pkg);
        String ll = label.toLowerCase(Locale.ROOT);
        if (!watched && (ll.contains("gopay") || ll.contains("gojek") || ll.contains("livin") || ll.contains("mandiri"))) watched = true;
        if (!watched) return;

        Parser.Result r = Parser.parse(pkg, title, bodyStr);
        if (r != null && "lain".equals(r.source)) {
            if (ll.contains("gopay") || ll.contains("gojek")) r.source = "gopay";
            else if (ll.contains("livin") || ll.contains("mandiri")) r.source = "mandiri";
        }
        long when = sbn.getPostTime() > 0 ? sbn.getPostTime() : System.currentTimeMillis();

        JSONObject log = new JSONObject();
        log.put("pkg", pkg);
        log.put("app", label);
        log.put("title", title);
        log.put("text", bodyStr.length() > 400 ? bodyStr.substring(0, 400) : bodyStr);
        log.put("t", when);
        log.put("ok", r != null);
        if (r != null) {
            log.put("kind", r.kind);
            log.put("amt", r.amount);
            log.put("m", r.merchant);
        }
        NotifStore.log(this, log);
        if (r == null) return;

        JSONObject tx = new JSONObject();
        tx.put("id", "n" + Long.toString(when, 36) + Integer.toString(Math.abs((pkg + r.amount + r.merchant).hashCode()) % 1296, 36));
        tx.put("kind", r.kind);
        tx.put("amt", r.amount);
        tx.put("m", r.merchant.isEmpty() ? label : r.merchant);
        tx.put("src", r.source);
        tx.put("app", label);
        tx.put("t", when);
        tx.put("sure", r.sure);
        tx.put("raw", (title + " — " + bodyStr).trim());

        // notifikasi yang sama sering diposting ulang (update), jadi kunci dibuat per menit
        String key = pkg + "|" + r.kind + "|" + r.amount + "|" + r.merchant.toLowerCase(Locale.ROOT) + "|" + (when / 120000L);
        NotifStore.addPending(this, key, tx);
    }

    private String appLabel(String pkg) {
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            CharSequence l = pm.getApplicationLabel(ai);
            if (l != null && l.length() > 0) return l.toString();
        } catch (Exception ignored) { }
        switch (pkg) {
            case "id.bmri.livin": return "Livin' by Mandiri";
            case "com.gojek.gopay": return "GoPay";
            case "com.gojek.app": return "Gojek";
            default: return pkg;
        }
    }

    private static String str(CharSequence cs) {
        return cs == null ? "" : cs.toString().trim();
    }
}
