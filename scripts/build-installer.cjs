/**
 * NdevTool Cross-Platform Installer Builder (Windows .exe Setup & Linux .run / .deb Installer)
 * - On Windows: Uses built-in .NET compiler (csc.exe) to compile a standalone single-file
 *   GUI + Silent Setup Installer:
 *     -> release/NdevTool-Setup-1.0.0.exe
 * - On Linux: Packages the standalone Linux bundle into:
 *     -> release/NdevTool-Setup-1.0.0-linux-x64.run (Self-extracting Linux installer)
 *     -> release/ndevtool_1.0.0_amd64.deb (Debian/Ubuntu package if dpkg-deb is present)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASE_ROOT = path.join(ROOT_DIR, 'release');
const VERSION = '1.0.0';

function log(msg) {
  console.log(`[NdevTool::Installer] ${msg}`);
}

function findCscExe() {
  const candidates = [
    'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    const out = execSync('where.exe csc', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split(/\r?\n/)[0];
    if (out && fs.existsSync(out)) return out;
  } catch {
    // ignore
  }
  return null;
}

function generateWindowsInstallerCsSource() {
  return `using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("NdevTool Setup Installer")]
[assembly: AssemblyDescription("NdevTool Ring0 Stealth Multi-Engine AI Coding Daemon Setup")]
[assembly: AssemblyProduct("NdevTool")]
[assembly: AssemblyVersion("${VERSION}.0")]
[assembly: AssemblyFileVersion("${VERSION}.0")]

namespace NdevToolSetup
{
    static class Program
    {
        [STAThread]
        static int Main(string[] args)
        {
            bool silent = false;
            string customDir = null;
            foreach (string a in args)
            {
                if (a.Equals("/S", StringComparison.OrdinalIgnoreCase) ||
                    a.Equals("--silent", StringComparison.OrdinalIgnoreCase) ||
                    a.Equals("/silent", StringComparison.OrdinalIgnoreCase))
                {
                    silent = true;
                }
                else if (a.StartsWith("/D=", StringComparison.OrdinalIgnoreCase))
                {
                    customDir = a.Substring(3).Trim('"');
                }
            }

            string defaultInstallDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                "NdevTool"
            );

            if (silent)
            {
                try
                {
                    PerformInstall(customDir ?? defaultInstallDir, true, true, false, delegate(int p, string s) { });
                    return 0;
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("Install error: " + ex.Message);
                    return 1;
                }
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm(defaultInstallDir));
            return 0;
        }

        public static void PerformInstall(
            string targetDir,
            bool createDesktopShortcut,
            bool createStartMenuShortcut,
            bool launchAfter,
            Action<int, string> onProgress)
        {
            onProgress(5, "Preparing target directory...");
            if (!Directory.Exists(targetDir))
            {
                Directory.CreateDirectory(targetDir);
            }

            // Close any running NdevTool instance in targetDir before overwriting
            try
            {
                foreach (Process proc in Process.GetProcessesByName("NdevTool"))
                {
                    try
                    {
                        proc.Kill();
                        proc.WaitForExit(2000);
                    }
                    catch { }
                }
            }
            catch { }

            onProgress(15, "Extracting embedded NdevTool runtime payload...");
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream payloadStream = asm.GetManifestResourceStream("NdevToolPayload.zip"))
            {
                if (payloadStream == null)
                {
                    throw new Exception("Embedded resource NdevToolPayload.zip not found in installer.");
                }
                using (ZipArchive archive = new ZipArchive(payloadStream, ZipArchiveMode.Read))
                {
                    int total = Math.Max(1, archive.Entries.Count);
                    int idx = 0;
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        idx++;
                        string relPath = entry.FullName.TrimStart('.', '/', '\\\\');
                        if (string.IsNullOrEmpty(relPath)) continue;
                        string fullPath = Path.Combine(targetDir, relPath.Replace('/', Path.DirectorySeparatorChar));
                        string dirName = Path.GetDirectoryName(fullPath);
                        if (!string.IsNullOrEmpty(dirName) && !Directory.Exists(dirName))
                        {
                            Directory.CreateDirectory(dirName);
                        }
                        if (!string.IsNullOrEmpty(entry.Name) && !entry.FullName.EndsWith("/") && !entry.FullName.EndsWith("\\\\"))
                        {
                            entry.ExtractToFile(fullPath, true);
                        }
                        int pct = 15 + (int)((idx * 65.0) / total);
                        onProgress(pct, "Extracting: " + entry.Name);
                    }
                }
            }

            string exePath = Path.Combine(targetDir, "NdevTool.exe");

            // Create Uninstall script & Windows Registry Uninstall key
            onProgress(85, "Registering uninstaller & system shortcuts...");
            string uninstallerBat = Path.Combine(targetDir, "Uninstall-NdevTool.bat");
            File.WriteAllText(uninstallerBat,
                "@echo off\\r\\n" +
                "echo Removing NdevTool...\\r\\n" +
                "taskkill /F /IM NdevTool.exe >nul 2>&1\\r\\n" +
                "del /F /Q \\"%USERPROFILE%\\\\Desktop\\\\NdevTool.lnk\\" >nul 2>&1\\r\\n" +
                "del /F /Q \\"%APPDATA%\\\\Microsoft\\\\Windows\\\\Start Menu\\\\Programs\\\\NdevTool.lnk\\" >nul 2>&1\\r\\n" +
                "reg delete \\"HKCU\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\NdevTool\\" /f >nul 2>&1\\r\\n" +
                "cd /d \\"%TEMP%\\"\\r\\n" +
                "rmdir /S /Q \\"" + targetDir + "\\"\\r\\n" +
                "echo NdevTool uninstalled successfully.\\r\\n"
            );

            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\NdevTool"))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "NdevTool (Stealth Multi-Engine AI Coding Daemon)");
                        key.SetValue("DisplayVersion", "${VERSION}");
                        key.SetValue("Publisher", "NdevTool Ring0 Systems");
                        key.SetValue("InstallLocation", targetDir);
                        key.SetValue("DisplayIcon", exePath);
                        key.SetValue("UninstallString", "\\"" + uninstallerBat + "\\"");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }

            if (createDesktopShortcut)
            {
                string desktopLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "NdevTool.lnk");
                CreateShortcut(desktopLnk, exePath, targetDir, "NdevTool Ring0 Stealth AI Coding Daemon");
            }

            if (createStartMenuShortcut)
            {
                string startMenuLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "NdevTool.lnk");
                CreateShortcut(startMenuLnk, exePath, targetDir, "NdevTool Ring0 Stealth AI Coding Daemon");
            }

            onProgress(100, "Installation complete!");

            if (launchAfter && File.Exists(exePath))
            {
                ProcessStartInfo psi = new ProcessStartInfo(exePath);
                psi.WorkingDirectory = targetDir;
                psi.UseShellExecute = true;
                Process.Start(psi);
            }
        }

        private static void CreateShortcut(string shortcutPath, string targetPath, string workingDir, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return;
                object shell = Activator.CreateInstance(shellType);
                object shortcut = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
                Type scType = shortcut.GetType();
                scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { targetPath });
                scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workingDir });
                scType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { description });
                scType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { targetPath + ",0" });
                scType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
            }
            catch { }
        }
    }

    public class SetupForm : Form
    {
        private TextBox txtPath;
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkLaunch;
        private ProgressBar progressBar;
        private Label lblStatus;
        private Button btnInstall;
        private Button btnBrowse;
        private Button btnCancel;

        public SetupForm(string defaultDir)
        {
            this.Text = "NdevTool v${VERSION} :: Setup Installer (Windows x64)";
            this.Size = new Size(560, 380);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(9, 14, 22);
            this.ForeColor = Color.FromArgb(220, 230, 242);
            this.Font = new Font("Consolas", 9.5F, FontStyle.Regular);

            Label lblHeader = new Label();
            lblHeader.Text = "NDEVTOOL :: RING0 STEALTH AI CODING DAEMON (v${VERSION})";
            lblHeader.Font = new Font("Consolas", 11F, FontStyle.Bold);
            lblHeader.ForeColor = Color.FromArgb(0, 255, 156);
            lblHeader.Location = new Point(22, 18);
            lblHeader.Size = new Size(500, 24);
            this.Controls.Add(lblHeader);

            Label lblSub = new Label();
            lblSub.Text = "Standalone Windows x64 Setup Wizard (Claude Code / Antigravity / Codex / DeepSeek)";
            lblSub.Font = new Font("Consolas", 8.5F, FontStyle.Regular);
            lblSub.ForeColor = Color.FromArgb(0, 229, 255);
            lblSub.Location = new Point(22, 42);
            lblSub.Size = new Size(510, 20);
            this.Controls.Add(lblSub);

            Label lblPath = new Label();
            lblPath.Text = "Installation Directory:";
            lblPath.Location = new Point(22, 74);
            lblPath.Size = new Size(400, 18);
            this.Controls.Add(lblPath);

            txtPath = new TextBox();
            txtPath.Text = defaultDir;
            txtPath.Location = new Point(22, 96);
            txtPath.Size = new Size(410, 24);
            txtPath.BackColor = Color.FromArgb(14, 22, 34);
            txtPath.ForeColor = Color.FromArgb(0, 255, 156);
            txtPath.BorderStyle = BorderStyle.FixedSingle;
            this.Controls.Add(txtPath);

            btnBrowse = new Button();
            btnBrowse.Text = "Browse...";
            btnBrowse.Location = new Point(440, 95);
            btnBrowse.Size = new Size(82, 25);
            btnBrowse.BackColor = Color.FromArgb(18, 29, 44);
            btnBrowse.ForeColor = Color.White;
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.Click += delegate {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtPath.Text = Path.Combine(fbd.SelectedPath, "NdevTool");
                    }
                }
            };
            this.Controls.Add(btnBrowse);

            chkDesktop = new CheckBox();
            chkDesktop.Text = "Create Desktop Shortcut";
            chkDesktop.Checked = true;
            chkDesktop.Location = new Point(22, 136);
            chkDesktop.Size = new Size(490, 22);
            this.Controls.Add(chkDesktop);

            chkStartMenu = new CheckBox();
            chkStartMenu.Text = "Create Start Menu Shortcut";
            chkStartMenu.Checked = true;
            chkStartMenu.Location = new Point(22, 162);
            chkStartMenu.Size = new Size(490, 22);
            this.Controls.Add(chkStartMenu);

            chkLaunch = new CheckBox();
            chkLaunch.Text = "Launch NdevTool immediately after installation completes";
            chkLaunch.Checked = true;
            chkLaunch.Location = new Point(22, 188);
            chkLaunch.Size = new Size(490, 22);
            this.Controls.Add(chkLaunch);

            lblStatus = new Label();
            lblStatus.Text = "Ready to install.";
            lblStatus.ForeColor = Color.FromArgb(160, 175, 195);
            lblStatus.Location = new Point(22, 224);
            lblStatus.Size = new Size(500, 20);
            this.Controls.Add(lblStatus);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(22, 248);
            progressBar.Size = new Size(500, 22);
            progressBar.Minimum = 0;
            progressBar.Maximum = 100;
            this.Controls.Add(progressBar);

            btnInstall = new Button();
            btnInstall.Text = "INSTALL NOW";
            btnInstall.Font = new Font("Consolas", 9.5F, FontStyle.Bold);
            btnInstall.Location = new Point(236, 290);
            btnInstall.Size = new Size(190, 34);
            btnInstall.BackColor = Color.FromArgb(0, 110, 75);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.Click += OnInstallClick;
            this.Controls.Add(btnInstall);

            btnCancel = new Button();
            btnCancel.Text = "Close";
            btnCancel.Location = new Point(434, 290);
            btnCancel.Size = new Size(88, 34);
            btnCancel.BackColor = Color.FromArgb(24, 34, 48);
            btnCancel.ForeColor = Color.LightGray;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.Click += delegate { this.Close(); };
            this.Controls.Add(btnCancel);
        }

        private void OnInstallClick(object sender, EventArgs e)
        {
            string targetDir = txtPath.Text.Trim();
            if (string.IsNullOrEmpty(targetDir)) return;

            btnInstall.Enabled = false;
            btnBrowse.Enabled = false;
            txtPath.ReadOnly = true;

            bool desktop = chkDesktop.Checked;
            bool startMenu = chkStartMenu.Checked;
            bool launch = chkLaunch.Checked;

            Thread worker = new Thread(delegate() {
                try
                {
                    Program.PerformInstall(targetDir, desktop, startMenu, launch, delegate(int pct, string msg) {
                        this.BeginInvoke((MethodInvoker)delegate {
                            progressBar.Value = Math.Min(100, Math.Max(0, pct));
                            lblStatus.Text = msg;
                        });
                    });
                    this.BeginInvoke((MethodInvoker)delegate {
                        lblStatus.ForeColor = Color.FromArgb(0, 255, 156);
                        lblStatus.Text = "Successfully installed to: " + targetDir;
                        btnCancel.Text = "Finish";
                        MessageBox.Show(
                            "NdevTool v${VERSION} has been installed successfully!\\n\\nDirectory: " + targetDir,
                            "NdevTool Setup Complete",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information
                        );
                        this.Close();
                    });
                }
                catch (Exception ex)
                {
                    this.BeginInvoke((MethodInvoker)delegate {
                        lblStatus.ForeColor = Color.FromArgb(255, 90, 90);
                        lblStatus.Text = "Error: " + ex.Message;
                        btnInstall.Enabled = true;
                        btnBrowse.Enabled = true;
                        txtPath.ReadOnly = false;
                        MessageBox.Show("Installation failed: " + ex.Message, "Setup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    });
                }
            });
            worker.IsBackground = true;
            worker.Start();
        }
    }
}
`;
}

function buildWindowsSetupExe() {
  const zipPath = path.join(RELEASE_ROOT, `NdevTool-v${VERSION}-win32-x64-portable.zip`);
  const setupExePath = path.join(RELEASE_ROOT, `NdevTool-Setup-${VERSION}.exe`);
  const csFilePath = path.join(RELEASE_ROOT, 'NdevToolSetup.cs');

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Portable ZIP not found at ${zipPath}. Run deploy-package.cjs first.`);
  }

  const cscExe = findCscExe();
  if (!cscExe) {
    throw new Error('Could not locate Microsoft .NET csc.exe compiler on this Windows machine.');
  }

  log(`Generating Windows Setup C# installer source...`);
  fs.writeFileSync(csFilePath, generateWindowsInstallerCsSource(), 'utf-8');

  if (fs.existsSync(setupExePath)) {
    try {
      fs.rmSync(setupExePath, { force: true });
    } catch (err) {
      try {
        execSync(`taskkill /F /IM "NdevTool-Setup-${VERSION}.exe"`, { stdio: 'ignore' });
      } catch {}
      try {
        fs.rmSync(setupExePath, { force: true });
      } catch {
        const oldBak = path.join(RELEASE_ROOT, `NdevTool-Setup-${VERSION}.old.${Date.now()}.exe`);
        try {
          fs.renameSync(setupExePath, oldBak);
        } catch {}
      }
    }
  }

  log(`Compiling standalone Windows Installer: ${setupExePath} ...`);
  const cmd = `"${cscExe}" /nologo /target:winexe /optimize+ /out:"${setupExePath}" /resource:"${zipPath}",NdevToolPayload.zip /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll "${csFilePath}"`;
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(csFilePath)) {
    fs.rmSync(csFilePath, { force: true });
  }

  if (fs.existsSync(setupExePath)) {
    const sizeMb = (fs.statSync(setupExePath).size / (1024 * 1024)).toFixed(2);
    log(`SUCCESS! Windows Setup Installer (.exe) created:`);
    log(`  -> ${setupExePath} (${sizeMb} MB)`);
  }
}

function buildLinuxInstallers() {
  const linuxTargetDir = path.join(RELEASE_ROOT, `NdevTool-linux-${process.arch}`);
  const runInstallerPath = path.join(
    RELEASE_ROOT,
    `NdevTool-Setup-${VERSION}-linux-${process.arch}.run`
  );
  const tarGzPath = path.join(
    RELEASE_ROOT,
    `NdevTool-v${VERSION}-linux-${process.arch}.tar.gz`
  );

  if (!fs.existsSync(linuxTargetDir)) {
    log(`Note: Linux unpacked folder (${linuxTargetDir}) is only built when running on Linux.`);
    return;
  }

  log(`Creating compressed Linux archive: ${tarGzPath}`);
  execSync(`tar -czf "${tarGzPath}" -C "${linuxTargetDir}" .`, { stdio: 'inherit' });

  const selfExtractingHeader = `#!/usr/bin/env bash
set -e
APP_NAME="NdevTool"
VERSION="${VERSION}"
INSTALL_DIR="\${NDEVTOOL_INSTALL_DIR:-\$HOME/.local/share/NdevTool}"
BIN_DIR="\$HOME/.local/bin"
DESKTOP_DIR="\$HOME/.local/share/applications"

if [ "\$1" = "--uninstall" ]; then
  echo "[NdevTool] Removing installation from \$INSTALL_DIR..."
  rm -rf "\$INSTALL_DIR" "\$BIN_DIR/ndevtool" "\$DESKTOP_DIR/ndevtool.desktop"
  echo "[NdevTool] Uninstalled successfully."
  exit 0
fi

echo "========================================================"
echo "  NdevTool v\$VERSION :: Linux Standalone Setup Installer"
echo "  Target Directory: \$INSTALL_DIR"
echo "========================================================"

mkdir -p "\$INSTALL_DIR" "\$BIN_DIR" "\$DESKTOP_DIR"

ARCHIVE_LINE=\$(awk '/^__NDEVTOOL_ARCHIVE_BELOW__/ {print NR + 1; exit 0; }' "\$0")
tail -n +\$ARCHIVE_LINE "\$0" | tar -xz -C "\$INSTALL_DIR"

chmod +x "\$INSTALL_DIR/ndevtool"
ln -sf "\$INSTALL_DIR/ndevtool" "\$BIN_DIR/ndevtool"

cat > "\$DESKTOP_DIR/ndevtool.desktop" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=NdevTool
Comment=NdevTool Ring0 Stealth Multi-Engine AI Coding Daemon
Exec="\$INSTALL_DIR/ndevtool"
Path=\$INSTALL_DIR
Terminal=false
Categories=Development;IDE;Utility;
StartupNotify=false
EOF

chmod +x "\$DESKTOP_DIR/ndevtool.desktop"

echo "[NdevTool] Installed successfully!"
echo "  - Run command : \$BIN_DIR/ndevtool"
echo "  - Desktop app : \$DESKTOP_DIR/ndevtool.desktop"
echo "  - Uninstall   : bash \$0 --uninstall"
exit 0
__NDEVTOOL_ARCHIVE_BELOW__
`;

  log(`Building self-extracting Linux installer: ${runInstallerPath}`);
  fs.writeFileSync(runInstallerPath, selfExtractingHeader, 'utf-8');
  const tarBuffer = fs.readFileSync(tarGzPath);
  fs.appendFileSync(runInstallerPath, tarBuffer);
  fs.chmodSync(runInstallerPath, 0o755);

  const sizeMb = (fs.statSync(runInstallerPath).size / (1024 * 1024)).toFixed(2);
  log(`SUCCESS! Linux Self-Extracting Installer (.run) created:`);
  log(`  -> ${runInstallerPath} (${sizeMb} MB)`);

  // Also build Debian/Ubuntu .deb package if dpkg-deb is installed
  try {
    execSync('which dpkg-deb', { stdio: 'ignore' });
    const debArch = process.arch === 'arm64' ? 'arm64' : 'amd64';
    const debStage = path.join(RELEASE_ROOT, 'deb-stage');
    const debOut = path.join(RELEASE_ROOT, `ndevtool_${VERSION}_${debArch}.deb`);

    if (fs.existsSync(debStage)) fs.rmSync(debStage, { recursive: true, force: true });
    fs.mkdirSync(path.join(debStage, 'DEBIAN'), { recursive: true });
    fs.mkdirSync(path.join(debStage, 'opt', 'ndevtool'), { recursive: true });
    fs.mkdirSync(path.join(debStage, 'usr', 'bin'), { recursive: true });
    fs.mkdirSync(path.join(debStage, 'usr', 'share', 'applications'), { recursive: true });

    fs.cpSync(linuxTargetDir, path.join(debStage, 'opt', 'ndevtool'), { recursive: true });

    const controlContent = `Package: ndevtool
Version: ${VERSION}
Section: devel
Priority: optional
Architecture: ${debArch}
Maintainer: NdevTool Systems <admin@ndevtool.local>
Description: NdevTool Ring0 Stealth Multi-Engine AI Coding Daemon
 Standalone Multi-Engine AI Coding Wrapper (Claude Code / Antigravity / Codex / DeepSeek)
 with Cross-Machine Handoff and Google Drive Sync.
`;
    fs.writeFileSync(path.join(debStage, 'DEBIAN', 'control'), controlContent, 'utf-8');
    fs.chmodSync(path.join(debStage, 'DEBIAN', 'control'), 0o644);

    const postinst = `#!/bin/sh
set -e
chmod +x /opt/ndevtool/ndevtool
ln -sf /opt/ndevtool/ndevtool /usr/bin/ndevtool
`;
    const postinstPath = path.join(debStage, 'DEBIAN', 'postinst');
    fs.writeFileSync(postinstPath, postinst, 'utf-8');
    fs.chmodSync(postinstPath, 0o755);

    const desktopEntry = `[Desktop Entry]
Type=Application
Version=1.0
Name=NdevTool
Comment=NdevTool Ring0 Stealth Multi-Engine AI Coding Daemon
Exec=/opt/ndevtool/ndevtool
Path=/opt/ndevtool
Terminal=false
Categories=Development;IDE;Utility;
`;
    fs.writeFileSync(
      path.join(debStage, 'usr', 'share', 'applications', 'ndevtool.desktop'),
      desktopEntry,
      'utf-8'
    );

    execSync(`dpkg-deb --build "${debStage}" "${debOut}"`, { stdio: 'inherit' });
    fs.rmSync(debStage, { recursive: true, force: true });
    log(`SUCCESS! Debian/Ubuntu Installer (.deb) created:`);
    log(`  -> ${debOut}`);
  } catch {
    // dpkg-deb not installed on this distro
  }
}

function main() {
  if (!fs.existsSync(RELEASE_ROOT)) {
    fs.mkdirSync(RELEASE_ROOT, { recursive: true });
  }
  if (process.platform === 'win32') {
    buildWindowsSetupExe();
  } else {
    buildLinuxInstallers();
  }
}

main();
