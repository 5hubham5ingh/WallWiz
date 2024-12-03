## Prerequisites

- **Kitty terminal**: For displaying the wallpaper grid in the terminal.
- **ImageMagick**: For extracting colours from wallpaper.
- **Extension scripts**: For setting the wallpaper and themes. You can write
  your own script or download the required ones from
  [here](https://github.com/5hubham5ingh/WallWiz/tree/main?tab=readme-ov-file#step-2-get-the-required-extension-scripts).

## Installation

### Step 1: Get the executable binary

#### Option 1: Download Executable

- You can download the executable binary from the
  [GitHub releases](https://github.com/5hubham5ingh/WallWiz/releases) page.

- Or, run

```bash
sudo curl -L $(curl -s https://api.github.com/repos/5hubham5ingh/WallWiz/releases/latest | grep -oP '"browser_download_url": "\K(.*)(?=")' | grep WallWiz) -o /usr/bin/WallWiz && sudo chmod +x /usr/bin/WallWiz
```

#### Option 2: Build from Source

- Follow the steps written in
  [build.sh](https://github.com/5hubham5ingh/WallWiz/blob/main/build.sh).
- Or, run

```bash
curl -fsSL https://raw.githubusercontent.com/5hubham5ingh/WallWiz/main/build.sh | sh
```


##### Prerequisites  

- **Git**: Required for cloning repositories.  
- **Curl**: Required for downloading files.  
- **Unzip**: Required for extracting archives.  
- **Make and GCC**: Required for building the QuickJS source code.  

Ensure these dependencies are installed on your system before proceeding.  

---

###### Build and Installation Steps  

1. **Fetch QuickJS Source Code**  
   Clone the QuickJS repository, build the source code, and install the QuickJS compiler and interpreter:  

   ```bash  
   git clone --depth 1 https://github.com/bellard/quickjs.git  
   cd quickjs  
   make  
   sudo make install  
   cd ..  
   ```  

2. **Download Required Library**  
   Fetch the `qjs-ext-lib` library, extract it, and prepare it for use:  

   ```bash  
   curl -L -o out.zip https://github.com/ctn-malone/qjs-ext-lib/archive/refs/tags/0.12.4.zip  
   unzip out.zip  
   mv qjs-ext-lib-0.12.4 qjs-ext-lib  
   rm out.zip  
   ```  

3. **Fetch Helper Scripts**  
   Clone the helper scripts from the `justjs` repository:  

   ```bash  
   git clone --depth 1 https://github.com/5hubham5ingh/justjs.git  
   ```  

4. **Clone the WallWiz Project**  
   Clone the WallWiz repository:  

   ```bash  
   git clone --depth 1 https://github.com/5hubham5ingh/WallWiz.git  
   ```  

5. **Build and Install WallWiz**  
   Navigate to the WallWiz source directory, build the project, and install it:  

   ```bash  
   cd WallWiz/src  
   qjsc -flto -D extensionScriptHandlerWorker.js -o WallWiz main.js  
   sudo cp WallWiz /usr/bin/  
   ```  

---

After running the script, WallWiz will be successfully installed.  

For additional setup and usage instructions, refer to the [Setup Guide](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Setup.md) and [Usage Guide](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Usage.md).  

---  

 **Notes**
- Ensure you have sufficient permissions for installing system-wide binaries (`sudo`).  
- The script assumes the default shell is `bash`. Adjust commands if using another shell.  

---

### Step 2: Get the required extension scripts

[See extensions](https://github.com/5hubham5ingh/WallWiz/blob/dev/docs/Extensions.md)

