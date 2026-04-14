# Mobile Store Release Guide

This project is configured with Capacitor for Android and iOS builds.

## Project Setup Completed

- Capacitor app id: `net.easykhata.app`
- App name: `EasyKhata`
- Platforms added:
  - `android/`
  - `ios/`

## Commands

- Build web + sync native projects:
  - `npm run mobile:build`
- Sync only:
  - `npm run cap:sync`
- Open Android project:
  - `npm run mobile:android`
- Open iOS project:
  - `npm run mobile:ios`

## Play Store (Android)

1. Run `npm run mobile:build`
2. Run `npm run mobile:android`
3. In Android Studio:
   - Build > Generate Signed Bundle / APK
   - Select Android App Bundle (AAB)
4. Upload `.aab` in Play Console
5. Complete:
   - App content
   - Data safety
   - Privacy policy URL
   - Screenshots and listing text

## App Store (iOS)

1. Run `npm run mobile:build`
2. Run `npm run mobile:ios` (on macOS with Xcode)
3. In Xcode:
   - Set Signing & Capabilities (Apple team + bundle id)
   - Product > Archive
   - Upload to App Store Connect
4. In App Store Connect:
   - Add app privacy details
   - Add screenshots and metadata
   - Submit for review

## Important Notes

- iOS build/signing must be done on macOS.
- Keep app ID/bundle ID consistent across stores.
- Update app icon/splash assets before final submission.
- Ensure `https://www.easykhata.net/legal/privacy.html` is used in store listings.
