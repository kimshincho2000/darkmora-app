# DarkMora Mobile App (Native Android APK)

DarkMora.uz saytining 1x1 bir xil, **WebView bo'lmagan (100% Native)** Android mobil ilovasi.

## Xususiyatlari:
- 🎬 **Native ExoPlayer**: Qotmasdan va tez video o'ynatish (sifat, 10s oldinga/orqaga, to'liq ekran).
- 🌌 **Amanogawa Dark UI**: darkmora.uz bilan 1x1 bir xil neon qorong'u interfeys.
- 📱 **Native Komponentlar**: WebView emas, React Native & Expo asosida Android OS bilan bevosita ishlaydi.
- 🔍 **Tezkor qidiruv va filtrlar**: Janrlar, yillar, yangi chiqqan qismlar, top 10 eng saralar.
- 📑 **Mening ro'yxatim (Watchlist)**: Sevimli animelarni saqlab qo'yish.
- 🚀 **GitHub Actions avtomatik build**: Hech qanday kompyuter yoki server kuchini talab qilmasdan, GitHub'ning o'zida APK yig'ib beradi.

---

## 🛠️ GitHub orqali APK ni chiqarish tartibi:

### 1-qadam: GitHub'da yangi repozitoriya oching
GitHub profilingizga kiring va yangi repository oching (masalan, `darkmora-app`).

### 2-qadam: Ushbu papkani GitHub'ga yuklang
Server terminalida quyidagi buyruqlarni bajaring:

```bash
cd /home/terminal/darkmora-app
git init
git add .
git commit -m "feat: DarkMora 1x1 Native Android App with GitHub Actions"
git branch -M main
git remote add origin https://github.com/<GITHUB_USERNAME>/<REPO_NAME>.git
git push -u origin main
```

*(Agar GitHub token so'rasa, GitHub Personal Access Token kiriting)*

### 3-qadam: Tayyor APK ni yuklab olish
1. GitHub repozitoriyangizga kiring.
2. Yuqoridagi **"Actions"** bo'limini bosing.
3. **"Build DarkMora Android APK"** jarayoni ishga tushganini ko'rasiz (taxminan 3-5 daqiqa davom etadi).
4. Jarayon yakunlangach, uning ustiga bosing va pastki **Artifacts** bo'limidan tayyor **`DarkMora-Android-APK`** faylini telefoningizga yuklab oling!
