package id.adi.keuanganku;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Membaca teks notifikasi bank / e-wallet dan mengambil nominal, arah (keluar/masuk/top up)
 * dan nama merchant. Murni Java supaya bisa dites tanpa Android.
 */
public final class Parser {

    public static final class Result {
        public long amount;
        public String kind = "out";      // out | in | topup
        public String merchant = "";
        public String source = "lain";   // mandiri | gopay | lain
        public boolean sure = true;
    }

    private static final Pattern AMOUNT = Pattern.compile(
            "(?:Rp\\.?|IDR)\\s?([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)(?:[.,]([0-9]{1,2}))?(?![0-9])",
            Pattern.CASE_INSENSITIVE);

    private static final String STOP =
            "(?=\\s+(?:berhasil|sebesar|senilai|dengan|pada|tanggal|tgl|telah|sudah|via|menggunakan|"
            + "sejumlah|nominal|melalui|dari rekening|dari saldo|ke rekening|ke rek|ref|no\\.?|id transaksi)\\b|[.,!;:()\\n]|\\s+-\\s|\\s+rp|$)";

    private static final Pattern TO = Pattern.compile(
            "(?:\\bke merchant|\\bmerchant|\\bkepada|\\bke|\\bdi|\\bpada)\\s*:?\\s+(.{2,48}?)" + STOP,
            Pattern.CASE_INSENSITIVE);

    private static final Pattern FROM = Pattern.compile(
            "(?:\\bdari|\\bpengirim)\\s*:?\\s+(.{2,48}?)" + STOP,
            Pattern.CASE_INSENSITIVE);

    private static final Pattern DASH = Pattern.compile(
            "(?:Rp\\.?|IDR)\\s?[0-9.,]+\\s*[-\u2013|]\\s*(.{2,48}?)(?=\\s{2,}|[,!;\\n]|\\s+[0-9][0-9.]*$|$)",
            Pattern.CASE_INSENSITIVE);

    private static final String[] PROMO_WORDS = {
            "promo", "diskon", "voucher", "s/d", "hingga rp", "hemat", "gratis", "dapatkan", "kupon", "penawaran"
    };

    private static final String[] IN_WORDS = {
            "dana masuk", "uang masuk", "transfer masuk", "telah masuk", "sudah masuk", "masuk ke rekening",
            "diterima", "menerima", "terima uang", "refund", "pengembalian dana", "gaji"
    };
    private static final String[] TOPUP_WORDS = {"top up", "topup", "top-up", "isi saldo", "isi ulang saldo"};
    private static final String[] OUT_WORDS = {
            "pembayaran", "bayar", "qris", "pembelian", "transfer ke", "kirim uang", "kirim ke", "debet", "debit",
            "terpotong", "dibayar", "membayar", "tarik tunai", "belanja", "transaksi berhasil", "transaksi sukses"
    };
    private static final String[] GENERIC_TITLES = {
            "livin", "mandiri", "gopay", "gojek", "pembayaran", "transaksi", "berhasil", "sukses", "notifikasi",
            "info", "transfer", "qris", "saldo"
    };

    private Parser() {}

    public static String sourceOf(String pkg) {
        if (pkg == null) return "lain";
        String p = pkg.toLowerCase(Locale.ROOT);
        if (p.contains("bmri") || p.contains("mandiri") || p.contains("livin")) return "mandiri";
        if (p.contains("gojek") || p.contains("gopay")) return "gopay";
        return "lain";
    }

    /** @return null bila tidak ada nominal yang bisa dibaca. */
    public static Result parse(String pkg, String title, String body) {
        String t = title == null ? "" : title.trim();
        String b = body == null ? "" : body.trim();
        String full = (t + "\n" + b).trim();
        String low = full.toLowerCase(Locale.ROOT);

        long amount = findAmount(full);
        if (amount <= 0) return null;

        if (containsAny(low, PROMO_WORDS)) return null;

        Result r = new Result();
        r.amount = amount;
        r.source = sourceOf(pkg);

        boolean decided = true;
        if (containsAny(low, TOPUP_WORDS)) r.kind = "topup";
        else if (containsAny(low, IN_WORDS)) r.kind = "in";
        else if (containsAny(low, OUT_WORDS)) r.kind = "out";
        else { r.kind = "out"; decided = false; }

        String m = "";
        if ("in".equals(r.kind)) m = firstGroup(FROM, b.isEmpty() ? full : b);
        if (m.isEmpty()) m = firstGroup(TO, b.isEmpty() ? full : b);
        if (m.isEmpty() && "in".equals(r.kind)) m = firstGroup(FROM, full);
        if (m.isEmpty()) m = firstGroup(TO, full);
        if (m.isEmpty()) m = firstGroup(DASH, full);
        m = clean(m);
        if (m.isEmpty() && !t.isEmpty() && !isGeneric(t)) m = clean(t);
        r.merchant = m;

        r.sure = decided && !m.isEmpty();
        return r;
    }

    static long findAmount(String text) {
        Matcher mt = AMOUNT.matcher(text);
        while (mt.find()) {
            int start = Math.max(0, mt.start() - 18);
            String before = text.substring(start, mt.start()).toLowerCase(Locale.ROOT);
            if (before.contains("saldo") || before.contains("sisa") || before.contains("limit")
                    || before.contains("poin") || before.contains("cashback")) continue;
            String digits = mt.group(1).replaceAll("[^0-9]", "");
            if (digits.isEmpty()) continue;
            try {
                long v = Long.parseLong(digits);
                if (v > 0) return v;
            } catch (NumberFormatException ignored) { }
        }
        return 0;
    }

    private static String firstGroup(Pattern p, String text) {
        Matcher m = p.matcher(text);
        while (m.find()) {
            String g = m.group(1).trim();
            String gl = g.toLowerCase(Locale.ROOT);
            if (gl.startsWith("rp") || gl.matches("^[0-9.,: ]+$")) continue;
            if (gl.startsWith("rekening") || gl.startsWith("saldo") || gl.startsWith("akun") || gl.startsWith("aplikasi")) continue;
            return g;
        }
        return "";
    }

    private static String clean(String s) {
        if (s == null) return "";
        String c = s.replaceAll("(?i)\\b(rp\\.?|idr)\\s?[0-9.,]+", "")
                .replaceAll("\\s+", " ")
                .replaceAll("^[\\s:\\-]+|[\\s:\\-]+$", "")
                .trim();
        if (c.length() > 48) c = c.substring(0, 48).trim();
        return c;
    }

    private static boolean isGeneric(String title) {
        String l = title.toLowerCase(Locale.ROOT);
        for (String g : GENERIC_TITLES) if (l.contains(g)) return true;
        return false;
    }

    private static boolean containsAny(String s, String[] words) {
        for (String w : words) if (s.contains(w)) return true;
        return false;
    }
}
