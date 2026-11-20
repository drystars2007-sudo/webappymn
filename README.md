# YmnTube

Privacy-respecting YouTube client (`YmnTube`) with both:
1. **Native Android App (Kotlin + Jetpack Compose)** under `app/` configured for **GitHub Actions** APK builds.
2. **Web App (React + Vite + Express)** under `src/` and `server.ts` for browser preview on port `3000`.

## Build Native Android APK with GitHub Actions

Push to the `main` or `master` branch (or trigger **Build Android APK** manually from the GitHub **Actions** tab).
The workflow (`.github/workflows/android-apk.yml`) sets up JDK 21, Android SDK, and Gradle `8.11.1`, runs:

```shell
gradle --no-daemon assembleDebug
```

and uploads the APK artifact **`YmnTube-debug-apk`** (`app/build/outputs/apk/debug/app-debug.apk`).

## Run Web Preview Locally

```shell
npm install
npm run dev
```

The web server listens on `http://0.0.0.0:3000`.
