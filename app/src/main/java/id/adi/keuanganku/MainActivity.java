package id.adi.keuanganku;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {

    private static final int REQ_FILE = 41;
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/www/index.html";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String sharedText = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(true);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                String[] accept = params.getAcceptTypes();
                String joined = accept == null ? "" : String.join(",", accept);
                if (joined.contains("json")) {
                    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                } else if (joined.contains(".xlsx") || joined.contains(".pdf") || joined.contains(".csv")) {
                    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "application/vnd.ms-excel", "text/csv", "text/comma-separated-values",
                            "application/csv", "text/plain", "application/pdf", "application/octet-stream"});
                }
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(i, "Pilih file"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "Android");
        setBars("#4fb3e8", true);
        readShare(getIntent());
        web.loadUrl(START);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (readShare(intent)) js("window.nativeShared&&nativeShared()");
    }

    @Override
    protected void onResume() {
        super.onResume();
        // beberapa HP mematikan layanan pembaca notifikasi di latar belakang; minta disambung ulang
        try {
            if (hasNotifAccess()) {
                android.service.notification.NotificationListenerService.requestRebind(new ComponentName(this, NotifService.class));
            }
        } catch (Throwable ignored) { }
        if (web != null) js("window.nativeResume&&nativeResume()");
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.nativeBack?String(nativeBack()):'false'", value -> {
            if (value == null || value.contains("false")) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                result = new Uri[n];
                for (int k = 0; k < n; k++) result[k] = data.getClipData().getItemAt(k).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    private boolean readShare(Intent intent) {
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction())) {
            String t = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (t != null && !t.trim().isEmpty()) {
                sharedText = t;
                return true;
            }
        }
        return false;
    }

    private void js(String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    @SuppressWarnings("deprecation")
    private void setBars(String color, boolean lightIcons) {
        try {
            Window w = getWindow();
            w.setStatusBarColor(Color.parseColor(color));
            View d = w.getDecorView();
            int flags = d.getSystemUiVisibility();
            if (lightIcons) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            else flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            d.setSystemUiVisibility(flags);
        } catch (Exception ignored) { }
    }

    private boolean hasNotifAccess() {
        String flat = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (flat == null) return false;
        String me = new ComponentName(this, NotifService.class).flattenToString();
        for (String part : flat.split(":")) {
            if (part.equals(me) || part.startsWith(getPackageName() + "/")) return true;
        }
        return false;
    }

    /** Fungsi yang bisa dipanggil dari halaman lewat window.Android */
    public class Bridge {
        private final Context ctx = getApplicationContext();

        @JavascriptInterface public String takePending() { return NotifStore.takePending(ctx); }
        @JavascriptInterface public int pendingCount() { return NotifStore.pendingCount(ctx); }
        @JavascriptInterface public String readLog() { return NotifStore.readLog(ctx); }
        @JavascriptInterface public void clearLog() { NotifStore.clearLog(ctx); }
        @JavascriptInterface public String detected() { return NotifStore.detected(ctx); }
        @JavascriptInterface public String getConfig() { return NotifStore.config(ctx).toString(); }
        @JavascriptInterface public void setConfig(String json) { NotifStore.setConfig(ctx, json); }
        @JavascriptInterface public boolean hasNotifAccess() { return MainActivity.this.hasNotifAccess(); }

        /** Uji pembaca notifikasi dengan teks bebas (dipakai juga untuk teks yang dibagikan ke aplikasi). */
        @JavascriptInterface public String parseText(String pkg, String title, String body) {
            Parser.Result r = Parser.parse(pkg, title, body);
            if (r == null) return "null";
            try {
                org.json.JSONObject o = new org.json.JSONObject();
                o.put("kind", r.kind);
                o.put("amt", r.amount);
                o.put("m", r.merchant);
                o.put("src", r.source);
                o.put("sure", r.sure);
                return o.toString();
            } catch (org.json.JSONException e) {
                return "null";
            }
        }

        @JavascriptInterface public String takeShared() {
            String t = sharedText;
            sharedText = null;
            return t == null ? "" : t;
        }

        @JavascriptInterface public String version() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface public String status() {
            try {
                org.json.JSONObject o = new org.json.JSONObject();
                o.put("connected", NotifStore.lastConnected(ctx));
                o.put("lastSeen", NotifStore.lastSeen(ctx));
                o.put("sdk", Build.VERSION.SDK_INT);
                o.put("maker", Build.MANUFACTURER);
                return o.toString();
            } catch (org.json.JSONException e) {
                return "{}";
            }
        }

        @JavascriptInterface public void openAppInfo() {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName()));
                    startActivity(i);
                } catch (Exception e) {
                    startActivity(new Intent(Settings.ACTION_SETTINGS));
                }
            });
        }

        @JavascriptInterface public void openBattery() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                } catch (Exception e) {
                    openAppInfo();
                }
            });
        }

        @JavascriptInterface public void openNotifSettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
                } catch (Exception e) {
                    startActivity(new Intent(Settings.ACTION_SETTINGS));
                }
            });
        }

        @JavascriptInterface public void setStatusBar(String color, boolean lightIcons) {
            runOnUiThread(() -> setBars(color, lightIcons));
        }

        @JavascriptInterface public void toast(String msg) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show());
        }

        /** Simpan file (base64) ke folder Download. @return lokasi file, atau "" bila gagal. */
        @JavascriptInterface public String saveFile(String name, String mime, String base64) {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver cr = getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Keuanganku");
                    Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) return "";
                    try (OutputStream os = cr.openOutputStream(uri)) {
                        if (os == null) return "";
                        os.write(bytes);
                    }
                    return "Download/Keuanganku/" + name;
                } else {
                    File dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "");
                    if (!dir.exists() && !dir.mkdirs()) return "";
                    File f = new File(dir, name);
                    try (FileOutputStream os = new FileOutputStream(f)) {
                        os.write(bytes);
                    }
                    return f.getAbsolutePath();
                }
            } catch (Exception e) {
                return "";
            }
        }

        /** Cetak / simpan halaman saat ini sebagai PDF lewat dialog cetak Android. */
        @JavascriptInterface public void printPage(String title) {
            runOnUiThread(() -> {
                try {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    PrintDocumentAdapter adapter = web.createPrintDocumentAdapter(title);
                    PrintAttributes attrs = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .build();
                    pm.print(title, adapter, attrs);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Tidak bisa membuka dialog cetak", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
