# DevApp Setup Instructions

## Environment Variables

- All static environment variables should be set in `filesUrl.ts`.

## Android Local Build & Installation

1. **Enable USB Debugging on Your Device**
   - On your Android phone, go to Developer Options and turn on USB debugging.
   - Connect your phone to your PC via USB.
   - Allow debugging permission when prompted on your device.

2. **Build and Install the App Locally**
   - In your project terminal, run:
     ```sh
     npm run android
     ```
   - Wait for the build process to complete. This may take some time.
   - The app will be automatically installed and opened on your device if your PC is properly configured for Android development.

> **Note:**
> You need a local build because installing packages outside the Expo community (from npm) will not work with Expo Go.

3. **If Your PC Is Not Set Up for Local Builds**
   - Follow the official Expo guide to set up your environment:
     https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&buildEnv=local

---

- For any static URLs or environment variables, edit `filesUrl.ts`.
- Make sure your Android device is connected and authorized for debugging before running the build command.
# egg-catching-game
