# Mig Android

Første Android-del af den personlige assistent.

## V1: korrespondancer og opfølgning

Appen har:

- fortløbende sagsnumre
- status: **Skal følges op**, **Venter på svar**, **Lukket**
- modpart, kanal, seneste udvikling, næste handling, opfølgningsdato og noter
- lokal lagring på telefonen
- startdata med de to aktuelle Hybel-sager
- automatisk kontrol for nyere versioner via GitHub Releases
- download af APK-opdatering direkte fra appen

Android tillader ikke almindelige apps at installere en APK helt lydløst. Brugeren skal derfor godkende installationen, og første gang også tillade "installer ukendte apps" for Mig.

## Byg

Projektet bruger:

- AGP 9.2.0
- Gradle 9.4.1
- JDK 17
- compileSdk 37
- Jetpack Compose BOM 2026.09.00

GitHub Actions-workflowet `.github/workflows/android-ci.yml` bygger en debug-APK.

## Sikker autoopdatering

Autoopdatering kræver, at alle release-APK'er signeres med den samme private nøgle. Nøglen må ikke committes til repoet.

Opret disse GitHub Actions secrets:

- `ANDROID_SIGNING_KEY` – base64 af keystore-filen
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`

Kør derefter workflowet **Android Release** med fx:

- version_name: `1.0.1`
- version_code: `2`

Workflowet opretter en GitHub Release med en signeret APK. Installer den første signerede release manuelt én gang. Derefter kan appen selv opdage nye releases og hente dem.
