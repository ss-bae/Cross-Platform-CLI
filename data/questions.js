/*
 * Question bank for the Cross-Platform CLI Practice Game.
 * Pure data: edit or add questions here without touching game logic.
 *
 * Coverage:
 *   Windows -> Command Prompt tools for navigation, networking, disks, files, info, and policy
 *   Linux   -> file, filesystem, admin, package, network, and info tools plus key /etc files
 *   macOS   -> the Linux commands that also work in the macOS Terminal, with macOS paths
 *
 * INFO[os][command] is the "what it does / switches worth knowing" note shown after
 * every correct answer for that command.
 *
 * Each question:
 *   id        unique string
 *   os        'windows' | 'linux' | 'macos'
 *   command   the command it drills (must have an INFO entry)
 *   category  topic group (Network, File management, ...)
 *   style     'scenario' | 'recall'
 *   q         question text; say when a switch or argument is expected
 *   answers   accepted answers; the first is the canonical one shown in hints.
 *             Whitespace is collapsed before comparing. Windows ignores case;
 *             Linux/macOS do not, so list exact-case variants only.
 *   hint      one-line nudge about the concept; must not name the answer
 *   why       why this command fits this question
 *   output    sample terminal output printed on a correct answer
 */
(function (root) {
  'use strict';
  const R = String.raw;

  const INFO = {
    windows: {
      'cd': R`cd (chdir) changes the current directory. "cd .." goes up one level, "cd \" jumps to the root of the drive, and "cd /d D:\path" also switches drives.`,
      'dir': R`dir lists files and folders. Switches to know: /a (include hidden/system files), /s (recurse into subfolders), /p (pause per screen), /w (wide list).`,
      'ipconfig': R`ipconfig shows the IP configuration of each adapter. Switches to know: /all (MAC, DHCP, DNS, lease details), /release and /renew (drop and request a DHCP lease), /flushdns (clear the DNS resolver cache), /displaydns.`,
      'ping': R`ping sends ICMP echo requests to test reachability and latency. Windows sends 4 by default. Switches to know: -t (continuous until Ctrl+C), -n count, -l size, -a (resolve address to name).`,
      'netstat': R`netstat shows network connections and listening ports. Switches to know: -a (all connections and listeners), -n (numeric, skip name lookups), -o (owning process ID), -b (executable name, needs admin).`,
      'nslookup': R`nslookup queries DNS servers directly to resolve names and troubleshoot DNS. "nslookup name" uses the default server; "nslookup name 8.8.8.8" asks a specific server.`,
      'net use': R`net use connects, lists, and removes mapped network drives. "net use Z: \\server\share" maps, "net use" lists, "net use Z: /delete" disconnects, /persistent:yes keeps it after reboot.`,
      'tracert': R`tracert lists every router hop between you and a destination with the latency of each, so you can see where traffic slows or stops. -d skips name resolution for speed.`,
      'pathping': R`pathping combines ping and tracert: it discovers the route, then spends time pinging every hop and reports packet loss per router. Slower than tracert but pinpoints lossy hops.`,
      'chkdsk': R`chkdsk checks a volume's file system. Plain chkdsk is read-only. Switches to know: /f (fix errors), /r (locate bad sectors and recover readable data; implies /f). The system drive is scheduled for the next reboot.`,
      'format': R`format writes a new file system to a volume, erasing it. Switches to know: /fs:ntfs|fat32|exfat (file system), /q (quick format), /v:label (volume label).`,
      'diskpart': R`diskpart is the interactive command-line disk partitioning tool (run as admin). Inside it: list disk, select disk n, list volume, clean, create partition primary, format fs=ntfs quick, assign letter=X.`,
      'md': R`md (also mkdir) creates a directory, including any missing parent folders in the path.`,
      'rmdir': R`rmdir (also rd) removes a directory. On its own it only removes empty folders. Switches to know: /s (remove contents too), /q (quiet, no confirmation).`,
      'robocopy': R`robocopy (Robust File Copy) copies folders reliably and can resume. Switches to know: /e (subfolders including empty ones), /s (subfolders except empty), /mir (mirror: also deletes extra files in the destination), /z (restartable mode).`,
      'hostname': R`hostname prints the computer's name. No switches needed.`,
      'net user': R`net user manages local user accounts. "net user" lists accounts, "net user name" shows details, "net user name pass /add" creates one, "net user name /delete" removes one. Add /domain to query the domain.`,
      'winver': R`winver opens the "About Windows" dialog showing the edition, version, and OS build number.`,
      'whoami': R`whoami prints the current domain\user. Switches to know: /groups (group memberships), /priv (privileges), /all.`,
      '/?': R`Adding /? to almost any Windows command prints its built-in help: syntax, switches, and examples. It's the fastest way to look up a switch you've forgotten.`,
      'gpupdate': R`gpupdate refreshes Group Policy. Plain gpupdate applies only changed settings; /force reapplies every setting; /logoff and /boot allow a sign-out or restart when a policy needs one.`,
      'gpresult': R`gpresult shows the Resultant Set of Policy (which GPOs actually applied). Switches to know: /r (summary for user and computer), /scope user|computer, /h file.html (HTML report).`,
      'sfc': R`sfc (System File Checker) verifies protected Windows system files and replaces corrupted ones from the component store. /scannow scans and repairs; /verifyonly scans without repairing. Run from an elevated prompt.`,
    },
    linux: {
      'ls': 'ls lists directory contents. Options to know: -l (long format: permissions, owner, size, date), -a (include hidden dotfiles), -h (human-readable sizes with -l). Options combine: ls -la.',
      'pwd': 'pwd (print working directory) shows the full path of the directory you are in.',
      'mv': 'mv moves or renames files and directories. "mv old new" renames; "mv file dir/" moves. It overwrites an existing target unless you add -i (ask first).',
      'cp': 'cp copies files. Options to know: -r or -R (copy a directory and everything in it), -i (ask before overwriting), -p (preserve permissions and timestamps).',
      'rm': 'rm deletes files permanently (no Recycle Bin). Options to know: -r (remove directories recursively), -f (force, no prompts), -i (ask first). rm -rf is powerful and dangerous.',
      'chmod': 'chmod changes permissions. Numeric mode adds r=4, w=2, x=1 for owner, group, and others: 755 = rwxr-xr-x, 644 = rw-r--r--, 600 = rw-------. Symbolic mode: u/g/o/a with +/-/= and r/w/x, e.g. chmod +x file.',
      'chown': 'chown changes a file\'s owner (and group with owner:group). -R applies it to a directory and everything inside. Changing ownership normally requires root (sudo).',
      'grep': 'grep searches text for lines matching a pattern. Options to know: -i (ignore case), -r (search directories recursively), -v (invert: lines that do NOT match), -n (show line numbers), -c (count matches).',
      'find': 'find searches a directory tree for files by attributes. Common tests: -name "pattern" (case-sensitive), -iname (ignore case), -type f|d, -size +100M, -mtime -7 (modified in the last 7 days).',
      'fsck': 'fsck checks and repairs a Linux file system (like chkdsk on Windows). Run it as root on an unmounted file system; -y answers yes to every repair prompt.',
      'mount': 'mount attaches a file system to a directory (mount point). "mount" alone lists what is mounted; "sudo mount /dev/sdb1 /mnt/usb" attaches a device; umount detaches it. Permanent mounts go in /etc/fstab.',
      'su': 'su (substitute user) switches to another account and asks for THAT account\'s password. "su -" (or su -l) starts a full login shell as root with root\'s environment; "su - alice" does the same for alice.',
      'sudo': 'sudo runs one command as root (or another user with -u) after asking for YOUR password, and logs it. Access is controlled by /etc/sudoers. "sudo -i" opens a root shell; "sudo !!" reruns the last command with sudo.',
      'apt': 'apt is the package manager on Debian/Ubuntu. Commands to know: apt update (refresh the package list), apt upgrade (install available updates), apt install pkg, apt remove pkg, apt search term. Needs sudo for changes.',
      'dnf': 'dnf is the package manager on Fedora/RHEL family distributions (successor to yum). Commands to know: dnf install pkg, dnf remove pkg, dnf upgrade (dnf update is an alias), dnf search term. Needs sudo for changes.',
      'ip': 'ip shows and configures network settings (replaces ifconfig/route). Commands to know: ip addr (or ip a) for addresses, ip link for interfaces and up/down state, ip route (or ip r) for the routing table and default gateway.',
      'ping': 'ping tests reachability with ICMP echo requests. On Linux it runs until Ctrl+C by default; -c count sends a set number. -i sets the interval.',
      'curl': 'curl transfers data to or from a URL (HTTP, HTTPS, FTP, and more). Options to know: -I (headers only), -O (save with the remote file name), -o file (save as a name you choose), -L (follow redirects).',
      'dig': 'dig (Domain Information Groper) queries DNS servers and shows full answers. Add a record type (A, MX, NS, TXT), use @server to ask a specific server, and +short for just the answer.',
      'traceroute': 'traceroute lists the routers (hops) between you and a destination with the latency to each. The Windows equivalent is tracert.',
      'man': 'man shows the manual page for a command: syntax, options, and examples. Navigate with arrows/space, search with /word, quit with q. "man -k keyword" searches all manual pages.',
      'cat': 'cat (concatenate) prints file contents to the terminal, or joins several files: "cat a b > c". For long files, less lets you scroll.',
      'top': 'top shows a live, updating view of processes sorted by CPU use, plus load average and memory. Inside: P sorts by CPU, M by memory, k kills a process, q quits.',
      'ps': 'ps lists processes as a snapshot. "ps" shows your terminal\'s processes; "ps aux" or "ps -ef" shows every process with its owner and PID. Pair with grep to find one, then kill PID to end it.',
      'du': 'du (disk usage) reports how much space files and directories use. Options to know: -h (human-readable), -s (summary total only). "du -sh dir" gives one total for a directory.',
      'df': 'df (disk free) reports used and available space for each mounted file system. -h shows human-readable sizes (G, M).',
      'nano': 'nano is a simple terminal text editor. The shortcut bar at the bottom shows commands: Ctrl+O saves (write Out), Ctrl+X exits, Ctrl+W searches. Use sudo nano for system files.',
      '/etc/passwd': '/etc/passwd lists user accounts, one per line: username:x:UID:GID:comment:home:shell. It is world-readable; the "x" means the password hash lives in /etc/shadow.',
      '/etc/shadow': '/etc/shadow holds the hashed passwords and password-aging rules for each account. Only root can read it, so viewing it needs sudo.',
      '/etc/hosts': '/etc/hosts maps hostnames to IP addresses locally and is normally checked before DNS. Editing it needs root.',
      '/etc/fstab': '/etc/fstab (file system table) lists the file systems to mount at boot: device or UUID, mount point, type, options, dump, and fsck order.',
      '/etc/resolv.conf': '/etc/resolv.conf lists the DNS servers ("nameserver" lines) and search domains the system uses for name resolution.',
    },
    macos: {
      'ls': 'ls lists directory contents. Options to know: -l (long format with permissions and owner), -a (include hidden dotfiles), -h (human-readable sizes with -l). Key macOS folders to explore: /Applications, /Users, /Library, /System.',
      'pwd': 'pwd (print working directory) shows the full path of the folder you are in. In the zsh prompt, ~ stands for your home folder, /Users/<you>.',
      'mv': 'mv moves or renames files and folders. "mv old new" renames; "mv file folder/" moves. It overwrites an existing target unless you add -i.',
      'cp': 'cp copies files. -R copies a folder and everything inside (on macOS, -R is the documented form; -r also works). -i asks before overwriting; -p preserves permissions and dates.',
      'rm': 'rm deletes files permanently; they do not go to the Trash. -r removes folders recursively, -f skips prompts, -i asks first. Removing items from /Applications usually needs sudo.',
      'chmod': 'chmod changes permissions. Numeric mode adds r=4, w=2, x=1 for owner, group, and others: 755 = rwxr-xr-x, 644 = rw-r--r--, 600 = rw-------. Symbolic: chmod +x file.',
      'chown': 'chown changes a file\'s owner (and group with owner:group). -R applies it recursively. On macOS the default group for users is "staff". Changing ownership needs sudo.',
      'grep': 'grep searches text for lines matching a pattern. Options to know: -i (ignore case), -r (recursive), -v (invert match), -n (line numbers), -c (count).',
      'find': 'find searches a folder tree by name, type, size, or date: -name "pattern", -iname (ignore case), -type f|d, -size +1G. Unlike Spotlight it searches live, including hidden and system folders.',
      'su': 'su (substitute user) switches to another account using THAT account\'s password. On macOS the root account is disabled by default, so admins use sudo instead of su to root.',
      'sudo': 'sudo runs one command as root after asking for YOUR password; only administrator accounts can use it on macOS. "sudo -i" opens a root shell; "sudo !!" reruns the last command elevated.',
      'ping': 'ping tests reachability with ICMP echo requests. Like Linux, macOS pings until Ctrl+C; -c count sends a set number.',
      'curl': 'curl transfers data to or from a URL and ships with macOS. Options to know: -I (headers only), -O (save with the remote name), -o file (save as a chosen name), -L (follow redirects).',
      'dig': 'dig queries DNS servers and shows full answers. Add a record type (A, MX, NS, TXT), @server to ask a specific server, +short for just the answer.',
      'traceroute': 'traceroute lists each router hop to a destination with its latency. Same name as Linux; Windows uses tracert.',
      'man': 'man shows a command\'s manual page. macOS uses BSD versions of many tools, so options can differ from Linux; the man page shows what your Mac actually supports. Press q to quit.',
      'cat': 'cat prints file contents to the terminal, or joins files: "cat a b > c". Use less to scroll long files.',
      'top': 'top shows live process and resource use. On macOS, "top -o cpu" sorts by CPU and "top -o mem" by memory. Activity Monitor is the GUI equivalent. Press q to quit.',
      'ps': 'ps lists a snapshot of processes. "ps aux" or "ps -ef" lists every process with its owner and PID; pair with grep to find one and kill PID to end it.',
      'du': 'du (disk usage) shows how much space files and folders use. -h human-readable, -s summary total. "du -sh /Applications" gives one total.',
      'df': 'df (disk free) shows used and available space per mounted volume. -h gives human-readable sizes. On modern macOS your data lives on /System/Volumes/Data.',
      'nano': 'nano is a simple terminal text editor (on recent macOS the nano command launches pico, which works the same way). Ctrl+O saves, Ctrl+X exits, Ctrl+W searches. Use sudo nano for system files.',
    },
  };

  const QUESTIONS = [
    // ===================================================================
    // WINDOWS  (prompt C:\Users\student>)
    // ===================================================================

    // ---- Navigation: cd ----
    {
      id: 'w-cd-1', os: 'windows', command: 'cd', category: 'Navigation', style: 'recall',
      q: 'Which command moves you up one level to the parent directory? Type the command with its argument.',
      answers: ['cd ..', 'cd..', 'chdir ..'],
      hint: 'Two dots always mean "the folder above this one."',
      why: 'cd changes directory, and ".." refers to the parent folder.',
      output: R`
C:\Users>`,
    },
    {
      id: 'w-cd-2', os: 'windows', command: 'cd', category: 'Navigation', style: 'scenario',
      q: R`You need to run a utility that lives in C:\Windows\System32, so you want that to be your working directory. Type the command to change to that folder using its full path.`,
      answers: [R`cd C:\Windows\System32`, R`cd /d C:\Windows\System32`, R`chdir C:\Windows\System32`],
      hint: 'You want to change your current location, not list or open anything.',
      why: 'cd with a full path jumps straight to that folder regardless of where you are on the drive.',
      output: R`
C:\Windows\System32>`,
    },
    {
      id: 'w-cd-3', os: 'windows', command: 'cd', category: 'Navigation', style: 'recall',
      q: 'Which command takes you straight to the root of the current drive? Type the command with its argument.',
      answers: ['cd \\', 'cd\\', 'chdir \\'],
      hint: 'On Windows, a single backslash at the start of a path means the top of the drive.',
      why: R`"cd \" jumps to the root of the current drive from any depth.`,
      output: R`
C:\>`,
    },

    // ---- Navigation: dir ----
    {
      id: 'w-dir-1', os: 'windows', command: 'dir', category: 'Navigation', style: 'recall',
      q: 'Which command lists the files and folders in the current directory? (No switches.)',
      answers: ['dir'],
      hint: 'This is the Windows equivalent of listing a directory.',
      why: 'dir with no arguments lists the current folder with dates, sizes, and free space.',
      output: R`
 Volume in drive C has no label.
 Volume Serial Number is 4A1E-93C2

 Directory of C:\Users\student

11/14/2026  09:12 AM    <DIR>          .
11/14/2026  09:12 AM    <DIR>          ..
11/02/2026  03:41 PM    <DIR>          Desktop
11/13/2026  10:05 AM    <DIR>          Documents
11/14/2026  08:57 AM    <DIR>          Downloads
11/10/2026  01:22 PM             2,348 notes.txt
               1 File(s)          2,348 bytes
               5 Dir(s)  112,904,617,984 bytes free`,
    },
    {
      id: 'w-dir-2', os: 'windows', command: 'dir', category: 'Navigation', style: 'scenario',
      q: 'A user insists a configuration file is in their profile folder, but a normal listing does not show it. You suspect the file is hidden. Type the listing command with the switch that shows hidden and system files too.',
      answers: ['dir /a', 'dir /ah'],
      hint: 'Think "attributes": this switch makes the listing ignore the hidden attribute.',
      why: 'dir /a lists entries regardless of attributes, so hidden and system files appear. /ah shows only hidden ones.',
      output: R`
 Directory of C:\Users\student

11/14/2026  09:12 AM    <DIR>          .
11/14/2026  09:12 AM    <DIR>          ..
11/02/2026  03:41 PM    <DIR>          AppData
11/02/2026  03:41 PM    <DIR>          Desktop
11/13/2026  10:05 AM    <DIR>          Documents
11/13/2026  04:18 PM               612 app.config
11/02/2026  03:40 PM         1,310,720 NTUSER.DAT
               2 File(s)      1,311,332 bytes
               5 Dir(s)  112,904,617,984 bytes free`,
    },
    {
      id: 'w-dir-3', os: 'windows', command: 'dir', category: 'Navigation', style: 'scenario',
      q: 'You need to find every .log file in the current folder and all of its subfolders. Type the listing command with the wildcard *.log and the switch that searches subdirectories.',
      answers: ['dir *.log /s', 'dir /s *.log'],
      hint: 'The switch you need stands for "subdirectories."',
      why: 'dir /s recurses into every subfolder, and the *.log wildcard filters the results.',
      output: R`
 Directory of C:\Users\student\AppData\Local\Temp

11/14/2026  08:01 AM            48,210 setup.log
               1 File(s)         48,210 bytes

 Directory of C:\Users\student\Documents\Logs

11/12/2026  05:30 PM             9,876 backup.log
               1 File(s)          9,876 bytes

     Total Files Listed:
               2 File(s)         58,086 bytes
               0 Dir(s)  112,904,617,984 bytes free`,
    },

    // ---- Network: ipconfig ----
    {
      id: 'w-ipconfig-1', os: 'windows', command: 'ipconfig', category: 'Network', style: 'recall',
      q: "Which command shows each adapter's IPv4 address, subnet mask, and default gateway? (No switches.)",
      answers: ['ipconfig'],
      hint: 'The command name is short for "IP configuration."',
      why: 'Plain ipconfig gives the essentials: address, mask, and gateway for each adapter.',
      output: R`
Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : corp.local
   IPv4 Address. . . . . . . . . . . : 192.168.1.42
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1`,
    },
    {
      id: 'w-ipconfig-2', os: 'windows', command: 'ipconfig', category: 'Network', style: 'recall',
      q: 'Which command (with switch) displays full adapter details, including the MAC address, DHCP server, lease times, and DNS servers?',
      answers: ['ipconfig /all'],
      hint: 'The basic command hides most details; the switch asks for everything.',
      why: 'ipconfig /all adds the physical (MAC) address, DHCP and DNS servers, and lease information.',
      output: R`
Windows IP Configuration

   Host Name . . . . . . . . . . . . : WS-STUDENT01
   Primary Dns Suffix  . . . . . . . : corp.local

Ethernet adapter Ethernet:

   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-V
   Physical Address. . . . . . . . . : 3C-52-82-1A-7F-09
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.1.42(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : Sunday, November 15, 2026 8:02:11 AM
   Lease Expires . . . . . . . . . . : Monday, November 16, 2026 8:02:11 AM
   Default Gateway . . . . . . . . . : 192.168.1.1
   DHCP Server . . . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.10`,
    },
    {
      id: 'w-ipconfig-3', os: 'windows', command: 'ipconfig', category: 'Network', style: 'scenario',
      q: 'A laptop that moved to a new office still holds its old DHCP lease and has no connectivity. First you need to give up the current lease. Type ipconfig with the switch that releases it.',
      answers: ['ipconfig /release'],
      hint: 'Before you can get a new lease, you have to let go of the old one.',
      why: 'ipconfig /release drops the current DHCP lease, leaving the adapter without an address until you renew.',
      output: R`
Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Default Gateway . . . . . . . . . :`,
    },
    {
      id: 'w-ipconfig-4', os: 'windows', command: 'ipconfig', category: 'Network', style: 'scenario',
      q: 'After releasing the lease, the laptop now needs a fresh address from the new office DHCP server. Type ipconfig with the switch that requests a new lease.',
      answers: ['ipconfig /renew'],
      hint: 'You are asking the DHCP server to issue the lease again.',
      why: 'ipconfig /renew sends a DHCP request and applies the new address, mask, gateway, and DNS settings.',
      output: R`
Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : branch.corp.local
   IPv4 Address. . . . . . . . . . . : 10.20.5.117
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.20.5.1`,
    },
    {
      id: 'w-ipconfig-5', os: 'windows', command: 'ipconfig', category: 'Network', style: 'scenario',
      q: "An internal web server moved to a new IP address. Other PCs reach it, but one workstation keeps going to the old address. Type ipconfig with the switch that clears that workstation's DNS resolver cache.",
      answers: ['ipconfig /flushdns'],
      hint: 'The workstation remembered an old name-to-address answer. Get rid of what it remembered.',
      why: 'ipconfig /flushdns empties the local DNS cache, so the next lookup asks the DNS server again and gets the new address.',
      output: R`
Windows IP Configuration

Successfully flushed the DNS Resolver Cache.`,
    },

    // ---- Network: ping ----
    {
      id: 'w-ping-1', os: 'windows', command: 'ping', category: 'Network', style: 'recall',
      q: 'Which command tests basic reachability to the host 8.8.8.8? Type it with that address.',
      answers: ['ping 8.8.8.8'],
      hint: 'Send an ICMP echo request and wait for a reply.',
      why: 'ping sends ICMP echo requests (4 by default on Windows) and reports replies and round-trip times.',
      output: R`
Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=14ms TTL=117
Reply from 8.8.8.8: bytes=32 time=13ms TTL=117
Reply from 8.8.8.8: bytes=32 time=15ms TTL=117
Reply from 8.8.8.8: bytes=32 time=13ms TTL=117

Ping statistics for 8.8.8.8:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 13ms, Maximum = 15ms, Average = 13ms`,
    },
    {
      id: 'w-ping-2', os: 'windows', command: 'ping', category: 'Network', style: 'scenario',
      q: 'You are about to reseat a flaky patch cable and want to watch replies from the gateway 192.168.1.1 the whole time, until you stop it with Ctrl+C. Type ping with the switch for continuous mode and that address.',
      answers: ['ping -t 192.168.1.1', 'ping 192.168.1.1 -t', 'ping /t 192.168.1.1', 'ping 192.168.1.1 /t'],
      hint: 'By default Windows stops after four echoes. One switch makes it keep going.',
      why: 'ping -t pings until you press Ctrl+C, so you can see the exact moment the link drops or recovers.',
      output: R`
Pinging 192.168.1.1 with 32 bytes of data:
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Request timed out.
Request timed out.
Reply from 192.168.1.1: bytes=32 time=2ms TTL=64
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64

Ping statistics for 192.168.1.1:
    Packets: Sent = 6, Received = 4, Lost = 2 (33% loss),
Control-C
^C`,
    },
    {
      id: 'w-ping-3', os: 'windows', command: 'ping', category: 'Network', style: 'scenario',
      q: 'A user reports no network access. You want to confirm the local TCP/IP stack itself is working before checking anything else. Type the command that pings the IPv4 loopback address 127.0.0.1.',
      answers: ['ping 127.0.0.1', 'ping localhost'],
      hint: 'Test the machine talking to itself first.',
      why: 'Pinging the loopback address tests the local TCP/IP stack without touching the network card or cable.',
      output: R`
Pinging 127.0.0.1 with 32 bytes of data:
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128

Ping statistics for 127.0.0.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`,
    },

    // ---- Network: netstat ----
    {
      id: 'w-netstat-1', os: 'windows', command: 'netstat', category: 'Network', style: 'recall',
      q: 'Which command (with switch) displays all active connections and all listening ports?',
      answers: ['netstat -a', 'netstat /a'],
      hint: 'The command name is short for "network statistics"; the switch means "all."',
      why: 'netstat -a includes listening ports as well as established connections.',
      output: R`
Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    0.0.0.0:135            WS-STUDENT01:0         LISTENING
  TCP    0.0.0.0:445            WS-STUDENT01:0         LISTENING
  TCP    192.168.1.42:139       WS-STUDENT01:0         LISTENING
  TCP    192.168.1.42:51522     lb-140-82-112-21:https ESTABLISHED
  TCP    192.168.1.42:51530     fileserver:microsoft-ds ESTABLISHED
  UDP    0.0.0.0:5353           *:*`,
    },
    {
      id: 'w-netstat-2', os: 'windows', command: 'netstat', category: 'Network', style: 'scenario',
      q: 'You suspect malware on a workstation is calling out to a remote server. You need every connection and listening port, with numeric addresses, plus the process ID that owns each one. Type netstat with the three switches that do this.',
      answers: ['netstat -ano', 'netstat -aon', 'netstat -nao', 'netstat -noa', 'netstat -oan', 'netstat -ona', 'netstat -a -n -o'],
      hint: 'You need three things: all connections, numbers instead of names, and the owning process.',
      why: 'netstat -ano shows all connections (-a), numerically (-n), with the owning PID (-o) that you can match in Task Manager.',
      output: R`
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1012
  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
  TCP    192.168.1.42:51522     140.82.112.21:443      ESTABLISHED     7240
  TCP    192.168.1.42:51577     203.0.113.66:4444      ESTABLISHED     9136
  UDP    0.0.0.0:5353           *:*                                    2260`,
    },

    // ---- Network: nslookup ----
    {
      id: 'w-nslookup-1', os: 'windows', command: 'nslookup', category: 'Network', style: 'scenario',
      q: 'A user reports they cannot reach any websites by name, but they can ping 8.8.8.8. Which command queries the DNS server directly? Type it to look up www.example.net.',
      answers: ['nslookup www.example.net'],
      hint: 'Pinging by IP works, so the trouble is turning names into addresses. Ask the name server yourself.',
      why: 'nslookup sends a query straight to the configured DNS server, showing whether name resolution is the failure point.',
      output: R`
Server:  dns1.corp.local
Address:  192.168.1.10

Non-authoritative answer:
Name:    www.example.net
Address:  192.0.2.10`,
    },
    {
      id: 'w-nslookup-2', os: 'windows', command: 'nslookup', category: 'Network', style: 'recall',
      q: 'Which Windows command is used to query DNS and troubleshoot name resolution? Type it to resolve example.com.',
      answers: ['nslookup example.com'],
      hint: 'The name says it: look up a name.',
      why: 'nslookup returns the DNS server used and the address records for the name.',
      output: R`
Server:  dns1.corp.local
Address:  192.168.1.10

Non-authoritative answer:
Name:    example.com
Addresses:  2600:1406:3a00:21::173e:2e65
          96.7.128.198`,
    },

    // ---- Network: net use ----
    {
      id: 'w-netuse-1', os: 'windows', command: 'net use', category: 'Network', style: 'recall',
      q: R`Which command maps drive letter Z: to the share \\fileserver\shared? Type it with that drive letter and path.`,
      answers: [R`net use Z: \\fileserver\shared`],
      hint: 'This is a two-word command that connects a drive letter to a network share.',
      why: 'net use followed by a drive letter and UNC path maps the share to that letter.',
      output: R`
The command completed successfully.`,
    },
    {
      id: 'w-netuse-2', os: 'windows', command: 'net use', category: 'Network', style: 'scenario',
      q: 'A department share moved to a new server, and the stale Z: mapping must be removed before you remap it. Type the command with the switch that disconnects the Z: drive.',
      answers: ['net use Z: /delete', 'net use Z: /d', 'net use /delete Z:', 'net use /d Z:'],
      hint: 'Same command that creates mappings, plus a switch that does the opposite.',
      why: 'net use Z: /delete disconnects that mapped drive.',
      output: R`
Z: was deleted successfully.`,
    },
    {
      id: 'w-netuse-3', os: 'windows', command: 'net use', category: 'Network', style: 'scenario',
      q: 'A user says "my shared drives are gone." Before changing anything, you want to see which network drives are currently mapped in their session. Type the command (no arguments).',
      answers: ['net use'],
      hint: 'The command that maps drives also lists them when given nothing else.',
      why: 'net use with no arguments lists current connections and their status (OK, Disconnected, Unavailable).',
      output: R`
New connections will be remembered.

Status       Local     Remote                    Network
-------------------------------------------------------------------------------
OK           H:        \\fileserver\home\student Microsoft Windows Network
Unavailable  S:        \\oldserver\sales          Microsoft Windows Network
The command completed successfully.`,
    },

    // ---- Network: tracert ----
    {
      id: 'w-tracert-1', os: 'windows', command: 'tracert', category: 'Network', style: 'recall',
      q: 'Which Windows command lists every router hop between you and example.net? Type it with that destination.',
      answers: ['tracert example.net'],
      hint: 'You want to trace the route the packets take.',
      why: 'tracert raises the TTL one hop at a time to reveal each router along the path.',
      output: R`
Tracing route to example.net [192.0.2.10]
over a maximum of 30 hops:

  1    <1 ms    <1 ms    <1 ms  192.168.1.1
  2     8 ms     7 ms     9 ms  10.64.0.1
  3    11 ms    10 ms    12 ms  isp-core1.example.net [198.51.100.9]
  4    13 ms    12 ms    13 ms  192.0.2.10

Trace complete.`,
    },
    {
      id: 'w-tracert-2', os: 'windows', command: 'tracert', category: 'Network', style: 'scenario',
      q: 'Users at a branch office say the vendor portal at portal.vendor.com times out, while other sites load fine. You want to see which hop along the path stops responding. Type the Windows command with that destination.',
      answers: ['tracert portal.vendor.com'],
      hint: 'Ping only tells you the destination failed. You want to see each router along the way.',
      why: 'tracert shows how far packets get; the hop where replies turn into timeouts is where to look.',
      output: R`
Tracing route to portal.vendor.com [203.0.113.80]
over a maximum of 30 hops:

  1    <1 ms    <1 ms    <1 ms  10.20.5.1
  2     9 ms     8 ms     8 ms  10.64.0.1
  3    12 ms    11 ms    13 ms  isp-core1.example.net [198.51.100.9]
  4     *        *        *     Request timed out.
  5     *        *        *     Request timed out.

Trace complete.`,
    },

    // ---- Network: pathping ----
    {
      id: 'w-pathping-1', os: 'windows', command: 'pathping', category: 'Network', style: 'recall',
      q: 'Which Windows command combines ping and tracert, reporting packet loss at every hop? Type it with the destination 8.8.8.8.',
      answers: ['pathping 8.8.8.8'],
      hint: 'The name joins the idea of a path with the idea of pinging.',
      why: 'pathping traces the route, then pings each hop for a while and reports per-hop loss.',
      output: R`
Tracing route to dns.google [8.8.8.8]
over a maximum of 30 hops:
  0  WS-STUDENT01.corp.local [192.168.1.42]
  1  192.168.1.1
  2  10.64.0.1
  3  dns.google [8.8.8.8]

Computing statistics for 75 seconds...
            Source to Here   This Node/Link
Hop  RTT    Lost/Sent = Pct  Lost/Sent = Pct  Address
  0                                           WS-STUDENT01.corp.local [192.168.1.42]
                                0/ 100 =  0%   |
  1    1ms     0/ 100 =  0%     0/ 100 =  0%  192.168.1.1
                                0/ 100 =  0%   |
  2    9ms     0/ 100 =  0%     0/ 100 =  0%  10.64.0.1
                                0/ 100 =  0%   |
  3   14ms     0/ 100 =  0%     0/ 100 =  0%  dns.google [8.8.8.8]

Trace complete.`,
    },
    {
      id: 'w-pathping-2', os: 'windows', command: 'pathping', category: 'Network', style: 'scenario',
      q: 'VoIP calls to the head office (10.0.0.5) keep breaking up. tracert shows every hop responding, but you suspect one router is dropping a small percentage of packets. Type the command that measures loss per hop to 10.0.0.5.',
      answers: ['pathping 10.0.0.5'],
      hint: 'You need route discovery plus long-running loss statistics for every hop.',
      why: "pathping samples each hop over time, revealing intermittent loss that a single tracert can't show.",
      output: R`
Tracing route to 10.0.0.5 over a maximum of 30 hops
  0  WS-STUDENT01.corp.local [192.168.1.42]
  1  192.168.1.1
  2  10.0.255.1
  3  10.0.0.5

Computing statistics for 75 seconds...
            Source to Here   This Node/Link
Hop  RTT    Lost/Sent = Pct  Lost/Sent = Pct  Address
  1    1ms     0/ 100 =  0%     0/ 100 =  0%  192.168.1.1
                                7/ 100 =  7%   |
  2   22ms     7/ 100 =  7%     0/ 100 =  0%  10.0.255.1
                                0/ 100 =  0%   |
  3   23ms     7/ 100 =  7%     0/ 100 =  0%  10.0.0.5

Trace complete.`,
    },

    // ---- Disk management: chkdsk ----
    {
      id: 'w-chkdsk-1', os: 'windows', command: 'chkdsk', category: 'Disk management', style: 'recall',
      q: 'Which command checks drive C: and fixes file system errors it finds? Type it with the drive letter and the fix switch.',
      answers: ['chkdsk C: /f', 'chkdsk /f C:'],
      hint: 'Without a switch, this tool only reports. You want it to fix.',
      why: 'chkdsk /f repairs file system errors. On the system drive it schedules the check for the next restart.',
      output: R`
The type of the file system is NTFS.
Cannot lock current drive.

Chkdsk cannot run because the volume is in use by another
process.  Would you like to schedule this volume to be
checked the next time the system restarts? (Y/N) Y

This volume will be checked the next time the system restarts.`,
    },
    {
      id: 'w-chkdsk-2', os: 'windows', command: 'chkdsk', category: 'Disk management', style: 'scenario',
      q: 'An external drive (E:) makes clicking noises, and some files fail to open with read errors. You want to locate bad sectors and recover whatever is still readable. Type chkdsk with the drive letter and the switch for this.',
      answers: ['chkdsk E: /r', 'chkdsk /r E:', 'chkdsk E: /f /r', 'chkdsk E: /r /f', 'chkdsk /f /r E:', 'chkdsk /r /f E:'],
      hint: 'Fixing logical errors is not enough here. You need the deeper scan of the physical surface.',
      why: 'chkdsk /r scans for bad sectors and recovers readable data (it includes everything /f does).',
      output: R`
The type of the file system is NTFS.
Volume label is BACKUP.

Stage 1: Examining basic file system structure ...
  65536 file records processed.
Stage 2: Examining file name linkage ...
Stage 3: Examining security descriptors ...
Stage 4: Looking for bad clusters in user file data ...
  Windows replaced bad clusters in file 4127
  of name \Photos\2024\IMG_0412.JPG.
Stage 5: Looking for bad, free clusters ...
  Adding 12 bad clusters to the Bad Clusters File.

Windows has made corrections to the file system.`,
    },
    {
      id: 'w-chkdsk-3', os: 'windows', command: 'chkdsk', category: 'Disk management', style: 'scenario',
      q: 'Before scheduling any repairs, you want a read-only report of file system health on drive D:. Type the command with the drive letter and no switches.',
      answers: ['chkdsk D:'],
      hint: 'The disk-checking tool only changes things when you add a switch.',
      why: 'chkdsk without /f or /r runs in read-only mode and just reports problems.',
      output: R`
The type of the file system is NTFS.
Volume label is DATA.

WARNING!  /F parameter not specified.
Running CHKDSK in read-only mode.

Stage 1: Examining basic file system structure ...
Stage 2: Examining file name linkage ...
Stage 3: Examining security descriptors ...

Windows has scanned the file system and found no problems.
No further action is required.`,
    },

    // ---- Disk management: format ----
    {
      id: 'w-format-1', os: 'windows', command: 'format', category: 'Disk management', style: 'recall',
      q: 'Which command formats drive E: with the NTFS file system? Type it with the drive letter and the file system switch.',
      answers: ['format E: /fs:ntfs', 'format /fs:ntfs E:'],
      hint: 'The switch name is short for "file system."',
      why: 'format with /fs:ntfs writes a new NTFS file system to the volume, erasing its contents.',
      output: R`
Insert new disk for drive E:
and press ENTER when ready...
The type of the file system is RAW.
The new file system is NTFS.
Verifying 58.5 GB
Format complete.
      58.5 GB total disk space.
      58.4 GB are available.`,
    },
    {
      id: 'w-format-2', os: 'windows', command: 'format', category: 'Disk management', style: 'scenario',
      q: 'A USB flash drive (F:) must work with both Windows and macOS and hold files larger than 4 GB. You want it done fast, without a full surface scan. Type format with the drive letter, the exFAT file system switch, and the quick switch.',
      answers: ['format F: /fs:exfat /q', 'format F: /q /fs:exfat', 'format /fs:exfat /q F:', 'format /q /fs:exfat F:'],
      hint: 'FAT32 caps files at 4 GB. Pick the cross-platform file system without that limit, and skip the slow scan.',
      why: 'exFAT works on Windows and macOS with no 4 GB file limit, and /q skips the bad-sector scan.',
      output: R`
Insert new disk for drive F:
and press ENTER when ready...
QuickFormatting 57.7 GB
Initializing the File Allocation Table (FAT)...
Format complete.
      57.7 GB total disk space.
      57.7 GB are available.`,
    },

    // ---- Disk management: diskpart ----
    {
      id: 'w-diskpart-1', os: 'windows', command: 'diskpart', category: 'Disk management', style: 'recall',
      q: 'Which command opens the interactive command-line utility for managing disks, partitions, and volumes?',
      answers: ['diskpart'],
      hint: 'It is the command-line counterpart to Disk Management, and its name joins "disk" and "partition."',
      why: 'diskpart starts an interactive shell (DISKPART>) where you select disks and create, delete, or format partitions.',
      output: R`
Microsoft DiskPart version 10.0.26100.1

Copyright (C) Microsoft Corporation.
On computer: WS-STUDENT01

DISKPART> list disk

  Disk ###  Status         Size     Free     Dyn  Gpt
  --------  -------------  -------  -------  ---  ---
  Disk 0    Online          476 GB      0 B        *
  Disk 1    Online          931 GB   931 GB        *`,
    },
    {
      id: 'w-diskpart-2', os: 'windows', command: 'diskpart', category: 'Disk management', style: 'scenario',
      q: 'The Disk Management console will not load on a server, but you still need to wipe a new disk and create a partition on it from an elevated command prompt. Which utility do you start?',
      answers: ['diskpart'],
      hint: 'You need the text-mode tool that does what Disk Management does.',
      why: 'diskpart can clean disks, create and delete partitions, format, and assign letters without the GUI.',
      output: R`
Microsoft DiskPart version 10.0.26100.1

Copyright (C) Microsoft Corporation.
On computer: SRV-FILE02

DISKPART> `,
    },

    // ---- File management: md ----
    {
      id: 'w-md-1', os: 'windows', command: 'md', category: 'File management', style: 'recall',
      q: 'Which command creates a new folder named Reports in the current directory? Type it with the folder name.',
      answers: ['md Reports', 'mkdir Reports'],
      hint: 'The short form is two letters: make directory.',
      why: 'md (or mkdir) creates a new directory.',
      output: R`
C:\Users\student>dir /b
Desktop
Documents
Downloads
Reports`,
    },
    {
      id: 'w-md-2', os: 'windows', command: 'md', category: 'File management', style: 'scenario',
      q: R`A script expects its output folder at C:\Logs\Archive, but neither folder exists yet. Type the single command that creates the full path C:\Logs\Archive.`,
      answers: [R`md C:\Logs\Archive`, R`mkdir C:\Logs\Archive`],
      hint: 'The folder-creating command builds any missing parent folders along the way.',
      why: 'md creates every missing folder in the path in one step.',
      output: R`
C:\Users\student>dir C:\Logs /b
Archive`,
    },

    // ---- File management: rmdir ----
    {
      id: 'w-rmdir-1', os: 'windows', command: 'rmdir', category: 'File management', style: 'recall',
      q: 'Which command removes the empty folder named OldFiles? Type it with the folder name.',
      answers: ['rmdir OldFiles', 'rd OldFiles'],
      hint: 'It is the opposite of making a directory.',
      why: 'rmdir (or rd) deletes a directory. Without switches the folder must be empty.',
      output: R`
C:\Users\student>`,
    },
    {
      id: 'w-rmdir-2', os: 'windows', command: 'rmdir', category: 'File management', style: 'scenario',
      q: 'A cleanup script must delete the folder Temp2023 and everything inside it, without asking for confirmation. Type rmdir with the two switches that make this happen.',
      answers: ['rmdir /s /q Temp2023', 'rmdir /q /s Temp2023', 'rd /s /q Temp2023', 'rd /q /s Temp2023', 'rmdir Temp2023 /s /q', 'rmdir Temp2023 /q /s', 'rd Temp2023 /s /q', 'rd Temp2023 /q /s'],
      hint: 'One switch includes the subfolders and files; the other keeps it quiet.',
      why: 'rmdir /s removes the whole tree and /q suppresses the "Are you sure?" prompt, which a script needs.',
      output: R`
C:\Users\student>`,
    },

    // ---- File management: robocopy ----
    {
      id: 'w-robocopy-1', os: 'windows', command: 'robocopy', category: 'File management', style: 'recall',
      q: R`Which command reliably copies C:\Data to D:\Backup, including all subfolders (even empty ones)? Type it with the source, destination, and the subfolder switch.`,
      answers: [R`robocopy C:\Data D:\Backup /e`, R`robocopy C:\Data D:\Backup /E`],
      hint: 'Use the "robust" copy tool. Its switch for subfolders including empty ones is one letter.',
      why: 'robocopy /e copies the full folder tree, including empty subfolders, and can retry on errors.',
      output: R`
-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------
  Source : C:\Data\
    Dest : D:\Backup\
 Options : *.* /S /E /DCOPY:DA /COPY:DAT /R:1000000 /W:30
-------------------------------------------------------------------------------
               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :        14        14         0         0         0         0
   Files :       312       312         0         0         0         0
   Bytes :   1.204 g   1.204 g         0         0         0         0`,
    },
    {
      id: 'w-robocopy-2', os: 'windows', command: 'robocopy', category: 'File management', style: 'scenario',
      q: R`Each night, \\nas\backup must be an exact copy of C:\Projects, so files deleted from the source should be deleted from the backup too. Type robocopy with the source, destination, and the switch that mirrors.`,
      answers: [R`robocopy C:\Projects \\nas\backup /mir`],
      hint: 'You want the destination to reflect the source exactly, deletions included.',
      why: 'robocopy /mir mirrors the tree (like /e plus /purge), removing destination files that no longer exist in the source.',
      output: R`
-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------
  Source : C:\Projects\
    Dest : \\nas\backup\
 Options : *.* /S /E /DCOPY:DA /COPY:DAT /PURGE /MIR /R:1000000 /W:30
-------------------------------------------------------------------------------
               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :        41         3        38         0         0         1
   Files :       988        27       961         0         0         6`,
    },

    // ---- Informational: hostname ----
    {
      id: 'w-hostname-1', os: 'windows', command: 'hostname', category: 'Informational', style: 'recall',
      q: "Which command prints the computer's name?",
      answers: ['hostname'],
      hint: 'In networking, the name of a computer is called its host name.',
      why: "hostname prints the machine's name with no extra output.",
      output: R`
WS-STUDENT01`,
    },
    {
      id: 'w-hostname-2', os: 'windows', command: 'hostname', category: 'Informational', style: 'scenario',
      q: 'A remote-support technician on the phone asks a user for the exact name of their PC so they can connect to it. Which single command shows only that name?',
      answers: ['hostname'],
      hint: 'You need just the machine name, nothing else.',
      why: 'hostname gives the exact computer name to connect to, without the noise of ipconfig /all.',
      output: R`
ACCT-LT-0457`,
    },

    // ---- Informational: net user ----
    {
      id: 'w-netuser-1', os: 'windows', command: 'net user', category: 'Informational', style: 'recall',
      q: 'Which two-word command lists every local user account on the computer?',
      answers: ['net user', 'net users'],
      hint: 'Windows has a family of networking commands that also manage accounts. Add the word for an account.',
      why: 'net user with no arguments lists the local accounts.',
      output: R`
User accounts for \\WS-STUDENT01

-------------------------------------------------------------------------------
Administrator            DefaultAccount           Guest
student                  WDAGUtilityAccount
The command completed successfully.`,
    },
    {
      id: 'w-netuser-2', os: 'windows', command: 'net user', category: 'Informational', style: 'scenario',
      q: 'User jsmith cannot sign in to a standalone workstation. You want to see if the account is active, when the password expires, and when they last logged on. Type the command for that account.',
      answers: ['net user jsmith'],
      hint: 'Use the accounts command, but name the account to get its details.',
      why: 'net user <name> shows account status, password dates, last logon, and group memberships.',
      output: R`
User name                    jsmith
Full Name                    Jordan Smith
Account active               No
Account expires              Never

Password last set            8/14/2026 9:30:12 AM
Password expires             11/12/2026 9:30:12 AM
Password changeable          8/15/2026 9:30:12 AM

Last logon                   11/11/2026 4:52:07 PM

Local Group Memberships      *Users
The command completed successfully.`,
    },

    // ---- Informational: winver ----
    {
      id: 'w-winver-1', os: 'windows', command: 'winver', category: 'Informational', style: 'recall',
      q: 'Which command opens the "About Windows" dialog showing the version and OS build?',
      answers: ['winver', 'winver.exe'],
      hint: 'Windows + version.',
      why: 'winver opens a small dialog with the edition, version, and build number.',
      output: R`
[About Windows dialog opened]
  Microsoft Windows
  Version 24H2 (OS Build 26100.2314)
  Windows 11 Pro`,
    },
    {
      id: 'w-winver-2', os: 'windows', command: 'winver', category: 'Informational', style: 'scenario',
      q: 'An update article applies only to certain Windows builds. You need to quickly confirm the exact version and build number on a user\'s PC. Which command shows that in a small dialog?',
      answers: ['winver', 'winver.exe'],
      hint: 'The command name is a mash-up of "Windows" and "version."',
      why: 'winver shows the build at a glance without opening Settings.',
      output: R`
[About Windows dialog opened]
  Microsoft Windows
  Version 23H2 (OS Build 22631.4460)
  Windows 11 Enterprise`,
    },

    // ---- Informational: whoami ----
    {
      id: 'w-whoami-1', os: 'windows', command: 'whoami', category: 'Informational', style: 'recall',
      q: 'Which command displays the domain and user name of the account you are currently signed in as?',
      answers: ['whoami'],
      hint: 'Ask the computer the question directly, as one word.',
      why: 'whoami prints domain\\username for the current session.',
      output: R`
corp\student`,
    },
    {
      id: 'w-whoami-2', os: 'windows', command: 'whoami', category: 'Informational', style: 'scenario',
      q: 'On a shared support workstation, you opened a command prompt with "Run as different user" and lost track of which account it is using. Which command confirms it?',
      answers: ['whoami'],
      hint: 'You need the identity of the current session, as one word.',
      why: 'whoami shows the exact account the prompt runs under, which matters before you make changes.',
      output: R`
corp\admin-jlee`,
    },
    {
      id: 'w-whoami-3', os: 'windows', command: 'whoami', category: 'Informational', style: 'scenario',
      q: 'A user cannot open a folder that is restricted to the Finance group. You want to list the groups their current session belongs to. Type the command with the switch that shows group memberships.',
      answers: ['whoami /groups'],
      hint: 'Same "who am I" command, with a switch for memberships.',
      why: 'whoami /groups lists the security groups in the current access token. A new group membership only appears after signing in again.',
      output: R`
GROUP INFORMATION
-----------------

Group Name                             Type             Attributes
====================================== ================ ==================================================
Everyone                               Well-known group Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                          Alias            Mandatory group, Enabled by default, Enabled group
CORP\Domain Users                      Group            Mandatory group, Enabled by default, Enabled group
CORP\Sales                             Group            Mandatory group, Enabled by default, Enabled group`,
    },

    // ---- Informational: [command] /? ----
    {
      id: 'w-help-1', os: 'windows', command: '/?', category: 'Informational', style: 'recall',
      q: 'How do you display the built-in help (syntax and switches) for the robocopy command? Type the command with the help switch.',
      answers: ['robocopy /?'],
      hint: 'Most Windows commands accept the same switch: a slash followed by a question mark.',
      why: 'Appending /? prints the command\'s built-in usage and switch list.',
      output: R`
-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

              Usage :: ROBOCOPY source destination [file [file]...] [options]

             source :: Source Directory (drive:\path or \\server\share\path).
        destination :: Destination Dir  (drive:\path or \\server\share\path).
...
                 /S :: copy Subdirectories, but not empty ones.
                 /E :: copy subdirectories, including Empty ones.
...`,
    },
    {
      id: 'w-help-2', os: 'windows', command: '/?', category: 'Informational', style: 'scenario',
      q: "You're about to repair a disk but can't remember the difference between chkdsk's /f and /r switches, and there's no internet access. Type the command that shows chkdsk's built-in help.",
      answers: ['chkdsk /?'],
      hint: 'Every Windows command carries its own help. Ask it with a two-character switch.',
      why: 'chkdsk /? lists every switch and what it does, right in the terminal.',
      output: R`
Checks a disk and displays a status report.

CHKDSK [volume[[path]filename]]] [/F] [/V] [/R] [/X] [/I] [/C] [/L[:size]] [/B]

  volume          Specifies the drive letter (followed by a colon),
                  mount point, or volume name.
  /F              Fixes errors on the disk.
  /R              Locates bad sectors and recovers readable information
                  (implies /F, when /scan not specified).
...`,
    },

    // ---- OS management: gpupdate ----
    {
      id: 'w-gpupdate-1', os: 'windows', command: 'gpupdate', category: 'OS management', style: 'recall',
      q: 'Which command (with switch) reapplies all Group Policy settings immediately, not just the ones that changed?',
      answers: ['gpupdate /force'],
      hint: 'Update the group policy, and make it reapply everything.',
      why: 'gpupdate /force reapplies every policy setting instead of only the changed ones.',
      output: R`
Updating policy...

Computer Policy update has completed successfully.
User Policy update has completed successfully.`,
    },
    {
      id: 'w-gpupdate-2', os: 'windows', command: 'gpupdate', category: 'OS management', style: 'scenario',
      q: "An administrator just linked a new GPO that maps a printer. A user doesn't want to wait up to 90 minutes for the background refresh. Type the command (no switches) that pulls down changed policy now.",
      answers: ['gpupdate'],
      hint: 'You are asking Windows to update group policy right now.',
      why: 'gpupdate triggers an immediate refresh of changed policy instead of waiting for the background interval.',
      output: R`
Updating policy...

Computer Policy update has completed successfully.
User Policy update has completed successfully.`,
    },
    {
      id: 'w-gpupdate-3', os: 'windows', command: 'gpupdate', category: 'OS management', style: 'scenario',
      q: 'A security setting from a GPO was changed locally on a PC, and a normal refresh did not put it back because the GPO itself has not changed. Type the command with the switch that reapplies every policy setting.',
      answers: ['gpupdate /force'],
      hint: 'A normal refresh skips unchanged policy. One switch makes it reapply all of them.',
      why: 'gpupdate /force reapplies all settings, overwriting the local change.',
      output: R`
Updating policy...

Computer Policy update has completed successfully.
User Policy update has completed successfully.`,
    },

    // ---- OS management: gpresult ----
    {
      id: 'w-gpresult-1', os: 'windows', command: 'gpresult', category: 'OS management', style: 'recall',
      q: 'Which command (with switch) shows a summary of the Group Policy objects applied to the current user and computer?',
      answers: ['gpresult /r'],
      hint: 'You want the result of group policy. The switch asks for a summary report.',
      why: 'gpresult /r displays the Resultant Set of Policy summary for user and computer.',
      output: R`
COMPUTER SETTINGS
------------------
    Last time Group Policy was applied: 11/15/2026 at 8:02:44 AM
    Applied Group Policy Objects
    -----------------------------
        Workstation Baseline
        Default Domain Policy

USER SETTINGS
--------------
    Applied Group Policy Objects
    -----------------------------
        Drive Mappings - Sales
        Default Domain Policy`,
    },
    {
      id: 'w-gpresult-2', os: 'windows', command: 'gpresult', category: 'OS management', style: 'scenario',
      q: 'A user should be getting a drive-mapping GPO, but the drive never appears. You want to see which GPOs actually applied to them and which were filtered out. Type the command with its summary switch.',
      answers: ['gpresult /r'],
      hint: 'Updating policy will not explain why. You need a report of the resulting policy.',
      why: 'gpresult /r lists applied GPOs and the ones that were filtered out (with a reason such as security filtering).',
      output: R`
USER SETTINGS
--------------
    Applied Group Policy Objects
    -----------------------------
        Default Domain Policy

    The following GPOs were not applied because they were filtered out
    -------------------------------------------------------------------
        Drive Mappings - Sales
            Filtering:  Denied (Security)`,
    },

    // ---- OS management: sfc ----
    {
      id: 'w-sfc-1', os: 'windows', command: 'sfc', category: 'OS management', style: 'recall',
      q: 'Which command (with switch) scans all protected Windows system files and repairs corrupted ones?',
      answers: ['sfc /scannow'],
      hint: 'System File Checker, told to scan right now.',
      why: 'sfc /scannow verifies protected system files and restores bad copies from the component store.',
      output: R`
Beginning system scan.  This process will take some time.

Beginning verification phase of system scan.
Verification 100% complete.

Windows Resource Protection found corrupt files and successfully repaired them.`,
    },
    {
      id: 'w-sfc-2', os: 'windows', command: 'sfc', category: 'OS management', style: 'scenario',
      q: 'After a failed update, Windows shows random DLL errors and some built-in tools crash. Malware scans are clean. You suspect corrupted system files. Type the command with the switch that checks and repairs them.',
      answers: ['sfc /scannow'],
      hint: 'Use the built-in tool that checks system files, and have it scan now.',
      why: 'sfc /scannow is the go-to repair for corrupted Windows system files (run from an elevated prompt).',
      output: R`
Beginning system scan.  This process will take some time.

Beginning verification phase of system scan.
Verification 100% complete.

Windows Resource Protection found corrupt files and successfully repaired them.
For online repairs, details are included in the CBS log file located at
windir\Logs\CBS\CBS.log.`,
    },

    // ===================================================================
    // LINUX  (prompt student@ubuntu:~$)
    // ===================================================================

    // ---- File management: ls ----
    {
      id: 'l-ls-1', os: 'linux', command: 'ls', category: 'File management', style: 'recall',
      q: 'Which command lists the contents of the current directory? (No options.)',
      answers: ['ls'],
      hint: 'Two letters, short for "list."',
      why: 'ls with no arguments lists the visible files and directories in the current directory.',
      output: R`
Desktop  Documents  Downloads  Music  notes.txt  Pictures  scripts`,
    },
    {
      id: 'l-ls-2', os: 'linux', command: 'ls', category: 'File management', style: 'recall',
      q: 'Which command lists the current directory in long format, showing permissions, owner, size, and date? Type it with the one option needed.',
      answers: ['ls -l'],
      hint: 'The option is a lowercase letter that stands for "long."',
      why: 'ls -l adds a line per entry with permissions, link count, owner, group, size, and modification time.',
      output: R`
total 24
drwxr-xr-x 2 student student 4096 Nov 14 09:12 Desktop
drwxr-xr-x 4 student student 4096 Nov 13 10:05 Documents
drwxr-xr-x 2 student student 4096 Nov 14 08:57 Downloads
-rw-r--r-- 1 student student 2348 Nov 10 13:22 notes.txt
drwxr-xr-x 2 student student 4096 Nov 12 16:40 scripts`,
    },
    {
      id: 'l-ls-3', os: 'linux', command: 'ls', category: 'File management', style: 'scenario',
      q: "A user changed their shell prompt in ~/.bashrc, but the file does not appear when they list their home directory. Type ls with the option that also shows hidden files (names starting with a dot).",
      answers: ['ls -a', 'ls --all'],
      hint: 'Files starting with a dot are hidden by default. You need to see all of them.',
      why: 'ls -a includes dotfiles such as .bashrc and .profile, plus the . and .. entries.',
      output: R`
.   .bash_history  .bashrc  .config  Documents  .profile  .ssh
..  .bash_logout   .cache   Desktop  Downloads  notes.txt  scripts`,
    },
    {
      id: 'l-ls-4', os: 'linux', command: 'ls', category: 'File management', style: 'scenario',
      q: "You need to check the permissions on hidden files in your home directory, such as .ssh. Type ls with the options for long format AND hidden files combined.",
      answers: ['ls -la', 'ls -al', 'ls -l -a', 'ls -a -l'],
      hint: 'Combine the "long" option with the "all" option.',
      why: 'ls -la shows hidden entries in long format, so you can see permissions on dotfiles.',
      output: R`
total 48
drwxr-x--- 7 student student 4096 Nov 15 08:01 .
drwxr-xr-x 4 root    root    4096 Oct 30 12:00 ..
-rw------- 1 student student 5120 Nov 15 08:00 .bash_history
-rw-r--r-- 1 student student 3771 Oct 30 12:00 .bashrc
drwx------ 2 student student 4096 Nov  1 09:44 .ssh
drwxr-xr-x 4 student student 4096 Nov 13 10:05 Documents
-rw-r--r-- 1 student student 2348 Nov 10 13:22 notes.txt`,
    },

    // ---- File management: pwd ----
    {
      id: 'l-pwd-1', os: 'linux', command: 'pwd', category: 'File management', style: 'recall',
      q: 'Which command prints the full path of the directory you are currently in?',
      answers: ['pwd'],
      hint: 'Print working directory.',
      why: 'pwd prints the absolute path of the current working directory.',
      output: R`
/home/student`,
    },
    {
      id: 'l-pwd-2', os: 'linux', command: 'pwd', category: 'File management', style: 'scenario',
      q: "After many cd commands while hunting through log folders, you've lost track of where you are and need the absolute path to paste into a support ticket. Which command gives it?",
      answers: ['pwd'],
      hint: 'You want the shell to print your current location.',
      why: 'pwd shows the absolute path of where you are now.',
      output: R`
/var/log/apache2/archive`,
    },

    // ---- File management: mv ----
    {
      id: 'l-mv-1', os: 'linux', command: 'mv', category: 'File management', style: 'recall',
      q: 'Which command renames report.txt to report-old.txt? Type it with both names.',
      answers: ['mv report.txt report-old.txt'],
      hint: 'Linux has no separate rename command for this; you move the file to a new name.',
      why: 'mv with a source and a new name in the same directory renames the file.',
      output: R`
student@ubuntu:~$ ls
report-old.txt`,
    },
    {
      id: 'l-mv-2', os: 'linux', command: 'mv', category: 'File management', style: 'scenario',
      q: 'You saved notes.txt in your home directory by mistake; it belongs in the Documents directory (also in your home). Type the command that relocates it, with the file name and the directory name Documents.',
      answers: ['mv notes.txt Documents', 'mv notes.txt Documents/', 'mv notes.txt ~/Documents', 'mv notes.txt ~/Documents/'],
      hint: 'You want the file in the new place and gone from the old one, not a copy.',
      why: 'mv moves the file into the target directory, removing it from the original location.',
      output: R`
student@ubuntu:~$ ls Documents
notes.txt  resume.odt`,
    },

    // ---- File management: cp ----
    {
      id: 'l-cp-1', os: 'linux', command: 'cp', category: 'File management', style: 'recall',
      q: 'Which command makes a copy of config.txt named config.bak in the same directory? Type it with both names.',
      answers: ['cp config.txt config.bak'],
      hint: 'Two letters, short for "copy."',
      why: 'cp source destination duplicates the file and leaves the original untouched.',
      output: R`
student@ubuntu:~$ ls
config.bak  config.txt`,
    },
    {
      id: 'l-cp-2', os: 'linux', command: 'cp', category: 'File management', style: 'scenario',
      q: 'Before a risky upgrade, you want a full backup copy of the directory project, including every file and subdirectory inside it, named project-backup. Type cp with the option that copies directories.',
      answers: ['cp -r project project-backup', 'cp -R project project-backup', 'cp -a project project-backup'],
      hint: 'Without one option, the copy command skips directories. You need it to work recursively.',
      why: 'cp -r (or -R) copies a directory and everything inside it.',
      output: R`
student@ubuntu:~$ ls
project  project-backup`,
    },

    // ---- File management: rm ----
    {
      id: 'l-rm-1', os: 'linux', command: 'rm', category: 'File management', style: 'recall',
      q: 'Which command deletes the file old.log? Type it with the file name.',
      answers: ['rm old.log'],
      hint: 'Two letters, short for "remove."',
      why: 'rm deletes the file permanently; there is no Recycle Bin in the terminal.',
      output: R`
student@ubuntu:~$ ls old.log
ls: cannot access 'old.log': No such file or directory`,
    },
    {
      id: 'l-rm-2', os: 'linux', command: 'rm', category: 'File management', style: 'scenario',
      q: 'A test run left behind a directory called tmpbuild full of files and subdirectories. Type rm with the option that deletes the directory and everything in it.',
      answers: ['rm -r tmpbuild', 'rm -R tmpbuild', 'rm -rf tmpbuild', 'rm -fr tmpbuild', 'rm -Rf tmpbuild', 'rm -r -f tmpbuild', 'rm --recursive tmpbuild'],
      hint: 'By itself the delete command refuses directories. Make it work recursively.',
      why: 'rm -r removes the directory and its contents recursively. Adding -f skips prompts; double-check the path first.',
      output: R`
student@ubuntu:~$ ls -d tmpbuild
ls: cannot access 'tmpbuild': No such file or directory`,
    },

    // ---- File management: chmod ----
    {
      id: 'l-chmod-1', os: 'linux', command: 'chmod', category: 'File management', style: 'recall',
      q: 'Using numeric permissions, set deploy.sh to rwxr-xr-x (owner full; group and others read and execute). Type the command.',
      answers: ['chmod 755 deploy.sh'],
      hint: 'Add r=4, w=2, x=1 for each of the owner, group, and others.',
      why: 'rwx = 4+2+1 = 7 and r-x = 4+1 = 5, so rwxr-xr-x is 755.',
      output: R`
student@ubuntu:~$ ls -l deploy.sh
-rwxr-xr-x 1 student student 812 Nov 15 09:30 deploy.sh`,
    },
    {
      id: 'l-chmod-2', os: 'linux', command: 'chmod', category: 'File management', style: 'scenario',
      q: 'SSH refuses to use your private key file id_rsa because "permissions are too open." Only you (the owner) should be able to read and write it, with no access for anyone else. Type the chmod command using numeric permissions.',
      answers: ['chmod 600 id_rsa'],
      hint: 'Owner gets read+write (4+2). Group and others get nothing.',
      why: 'rw------- is 600: owner read/write, no group or other access, which SSH requires for private keys.',
      output: R`
student@ubuntu:~/.ssh$ ls -l id_rsa
-rw------- 1 student student 2602 Nov  1 09:44 id_rsa`,
    },
    {
      id: 'l-chmod-3', os: 'linux', command: 'chmod', category: 'File management', style: 'scenario',
      q: 'A web page file index.html should be readable by everyone but writable only by its owner. Type the chmod command using numeric permissions.',
      answers: ['chmod 644 index.html'],
      hint: 'Owner read+write; group and others read only. Turn each into a number.',
      why: 'rw-r--r-- is 644, the usual permission for web content and documents.',
      output: R`
student@ubuntu:~$ ls -l index.html
-rw-r--r-- 1 student student 1450 Nov 15 09:41 index.html`,
    },
    {
      id: 'l-chmod-4', os: 'linux', command: 'chmod', category: 'File management', style: 'recall',
      q: 'Using symbolic mode, which command makes backup.sh executable? Type it with the + form.',
      answers: ['chmod +x backup.sh', 'chmod a+x backup.sh', 'chmod u+x backup.sh'],
      hint: 'Symbolic mode adds a permission with a plus sign and a letter.',
      why: 'chmod +x adds execute permission so you can run ./backup.sh.',
      output: R`
student@ubuntu:~$ ls -l backup.sh
-rwxr-xr-x 1 student student 412 Nov 15 09:50 backup.sh`,
    },

    // ---- File management: chown ----
    {
      id: 'l-chown-1', os: 'linux', command: 'chown', category: 'File management', style: 'recall',
      q: 'Which command makes alice the owner of report.txt? Type it with sudo, the user name, and the file.',
      answers: ['sudo chown alice report.txt'],
      hint: 'You are changing the owner, not the permissions.',
      why: 'chown sets the file owner. Giving a file to another user requires root, hence sudo.',
      output: R`
student@ubuntu:~$ ls -l report.txt
-rw-r--r-- 1 alice student 3021 Nov 15 10:02 report.txt`,
    },
    {
      id: 'l-chown-2', os: 'linux', command: 'chown', category: 'File management', style: 'scenario',
      q: 'After you copied a website into /var/www/html, the web server (running as user and group www-data) cannot write to its upload folders. Type the command with sudo that gives www-data user AND group ownership of /var/www/html and everything inside it.',
      answers: ['sudo chown -R www-data:www-data /var/www/html', 'sudo chown -R www-data:www-data /var/www/html/', 'sudo chown --recursive www-data:www-data /var/www/html'],
      hint: 'Change the owner and group together (owner:group), recursively.',
      why: 'chown -R www-data:www-data sets user and group on the whole tree so the web server owns its files.',
      output: R`
student@ubuntu:~$ ls -ld /var/www/html
drwxr-xr-x 6 www-data www-data 4096 Nov 15 10:10 /var/www/html`,
    },

    // ---- File management: grep ----
    {
      id: 'l-grep-1', os: 'linux', command: 'grep', category: 'File management', style: 'recall',
      q: 'Which command prints every line containing the word error in the file app.log? Type it with the pattern and file name.',
      answers: ['grep error app.log', 'grep "error" app.log', "grep 'error' app.log"],
      hint: 'Use the pattern-matching search tool, giving it the word and then the file.',
      why: 'grep prints each line of the file that matches the pattern.',
      output: R`
2026-11-15 08:14:02 error: database connection refused
2026-11-15 08:14:32 error: retry 1/3 failed
2026-11-15 08:15:02 error: retry 2/3 failed`,
    },
    {
      id: 'l-grep-2', os: 'linux', command: 'grep', category: 'File management', style: 'scenario',
      q: 'You are investigating failed logins and need every line in /var/log/auth.log containing "failed", whether it is written Failed, FAILED, or failed. Type grep with sudo and the option that ignores case.',
      answers: ['sudo grep -i failed /var/log/auth.log', 'sudo grep -i "failed" /var/log/auth.log', "sudo grep -i 'failed' /var/log/auth.log"],
      hint: 'The search tool is case-sensitive by default. One option turns that off.',
      why: 'grep -i matches regardless of capitalization. auth.log is readable only by privileged users, hence sudo.',
      output: R`
Nov 15 07:58:11 ubuntu sshd[1822]: Failed password for invalid user admin from 203.0.113.50 port 51612 ssh2
Nov 15 07:58:14 ubuntu sshd[1822]: Failed password for invalid user admin from 203.0.113.50 port 51612 ssh2
Nov 15 08:03:40 ubuntu sudo: pam_unix(sudo:auth): authentication failure; logname=student uid=1000`,
    },
    {
      id: 'l-grep-3', os: 'linux', command: 'grep', category: 'File management', style: 'scenario',
      q: 'A project in the directory src has a hard-coded password somewhere in one of its many files. Type grep with the option that searches every file under src for the text password.',
      answers: ['grep -r password src', 'grep -R password src', 'grep -r "password" src', "grep -r 'password' src", 'grep -r password src/', 'grep -R password src/'],
      hint: 'Make the search walk the whole directory tree.',
      why: 'grep -r searches recursively and prefixes each match with its file name.',
      output: R`
src/config/db.py:    password = "Summer2026!"
src/tests/test_login.py:    assert login("admin", password) is True`,
    },

    // ---- File management: find ----
    {
      id: 'l-find-1', os: 'linux', command: 'find', category: 'File management', style: 'recall',
      q: 'Which command searches the entire file system (starting at /) for files named hosts? Type it with the starting point and the -name test.',
      answers: ['find / -name hosts', 'find / -name "hosts"', "find / -name 'hosts'"],
      hint: 'Use the tool that walks directories testing each file, starting from the root.',
      why: 'find / -name hosts walks the whole tree from / and prints matching paths (expect "Permission denied" noise without sudo).',
      output: R`
find: '/root': Permission denied
/etc/hosts
/usr/share/doc/netbase/examples/hosts
find: '/proc/1/task/1/fd': Permission denied`,
    },
    {
      id: 'l-find-2', os: 'linux', command: 'find', category: 'File management', style: 'scenario',
      q: 'A user downloaded several PDF manuals somewhere under /home/student but cannot remember where. Type find with that starting directory and a -name test for "*.pdf" (keep the quotes so the shell does not expand the wildcard).',
      answers: ['find /home/student -name "*.pdf"', "find /home/student -name '*.pdf'", 'find ~ -name "*.pdf"', "find ~ -name '*.pdf'"],
      hint: 'Search by name pattern starting from the home directory.',
      why: 'find with -name "*.pdf" lists every matching file under the starting directory, however deep.',
      output: R`
/home/student/Downloads/router-manual.pdf
/home/student/Documents/hr/benefits-2026.pdf
/home/student/Documents/training/cli-cheatsheet.pdf`,
    },

    // ---- Filesystem management: fsck ----
    {
      id: 'l-fsck-1', os: 'linux', command: 'fsck', category: 'Filesystem management', style: 'recall',
      q: 'Which command checks and repairs a Linux file system? Type it with sudo and the partition /dev/sdb1.',
      answers: ['sudo fsck /dev/sdb1'],
      hint: 'File system + check. It is the Linux counterpart to chkdsk.',
      why: 'fsck checks the file system on the device and offers to repair errors.',
      output: R`
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
/dev/sdb1: clean, 11/1310720 files, 126322/5242624 blocks`,
    },
    {
      id: 'l-fsck-2', os: 'linux', command: 'fsck', category: 'Filesystem management', style: 'scenario',
      q: 'A USB disk (/dev/sdc1) was yanked out mid-copy and now gives I/O errors. You have unmounted it. Type the command with sudo that checks the file system and repairs it.',
      answers: ['sudo fsck /dev/sdc1', 'sudo fsck -y /dev/sdc1'],
      hint: 'Use the Linux file system checker on the unmounted partition.',
      why: 'fsck repairs file system inconsistencies; it must run on an unmounted file system to avoid damage.',
      output: R`
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
/dev/sdc1 was not cleanly unmounted, check forced.
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
Free blocks count wrong (812447, counted=812440).
Fix<y>? yes

/dev/sdc1: ***** FILE SYSTEM WAS MODIFIED *****
/dev/sdc1: 1204/3907584 files (0.4% non-contiguous), 140912/15628032 blocks`,
    },

    // ---- Filesystem management: mount ----
    {
      id: 'l-mount-1', os: 'linux', command: 'mount', category: 'Filesystem management', style: 'recall',
      q: 'Which command attaches the partition /dev/sdb1 to the directory /mnt/usb? Type it with sudo, the device, and the mount point.',
      answers: ['sudo mount /dev/sdb1 /mnt/usb'],
      hint: 'Attach the device to a directory in the tree.',
      why: 'mount device mountpoint makes the file system on the device accessible at that directory.',
      output: R`
student@ubuntu:~$ ls /mnt/usb
backup-2026-11.tar.gz  photos  README.txt`,
    },
    {
      id: 'l-mount-2', os: 'linux', command: 'mount', category: 'Filesystem management', style: 'scenario',
      q: 'A user says their data drive "is not showing up." Before anything else, you want to list every file system that is currently mounted and where. Which command, run with no arguments, shows that?',
      answers: ['mount'],
      hint: 'The command that attaches file systems also lists them when given nothing.',
      why: 'mount with no arguments lists every mounted file system, its mount point, type, and options.',
      output: R`
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
/dev/sda2 on / type ext4 (rw,relatime)
/dev/sda1 on /boot/efi type vfat (rw,relatime,fmask=0077,dmask=0077)
tmpfs on /run type tmpfs (rw,nosuid,nodev,size=1631048k,mode=755)`,
    },

    // ---- Administrative: su ----
    {
      id: 'l-su-1', os: 'linux', command: 'su', category: 'Administrative', style: 'recall',
      q: "Which command starts a full login shell as the root user, with root's environment? Type it with the dash option.",
      answers: ['su -', 'su -l', 'su - root', 'su --login', 'su -l root'],
      hint: 'Substitute user. With no name it means root; a dash gives you a login shell.',
      why: 'su - switches to root with a login shell, asking for the root password.',
      output: R`
Password:
root@ubuntu:~#`,
    },
    {
      id: 'l-su-2', os: 'linux', command: 'su', category: 'Administrative', style: 'scenario',
      q: "A user named alice reports a problem only under her account. You know her password and want to switch to her account in your current terminal. Type the command with her user name (no options).",
      answers: ['su alice'],
      hint: 'Substitute the user you are acting as, naming the account.',
      why: "su alice switches to alice's account after you enter alice's password.",
      output: R`
Password:
alice@ubuntu:/home/student$`,
    },

    // ---- Administrative: sudo ----
    {
      id: 'l-sudo-1', os: 'linux', command: 'sudo', category: 'Administrative', style: 'recall',
      q: 'Which command runs a single command with root privileges using YOUR password? Type it to run reboot.',
      answers: ['sudo reboot'],
      hint: 'Prefix the command with the word that means "superuser do."',
      why: 'sudo runs one command as root after checking your password against /etc/sudoers, and logs it.',
      output: R`
[sudo] password for student:

Broadcast message from root@ubuntu on pts/0 (Sun 2026-11-15 10:30:01 UTC):

The system will reboot now!`,
    },
    {
      id: 'l-sudo-2', os: 'linux', command: 'sudo', category: 'Administrative', style: 'scenario',
      q: 'You ran "systemctl restart ssh" and got "Access denied." Rather than retyping it, type the shortcut that reruns your previous command with root privileges.',
      answers: ['sudo !!'],
      hint: 'Prefix with the elevate command, then use the shell shortcut for "the last command" (two exclamation marks).',
      why: 'sudo !! repeats the previous command with sudo, because !! expands to your last command.',
      output: R`
sudo systemctl restart ssh
[sudo] password for student:
student@ubuntu:~$`,
    },
    {
      id: 'l-sudo-3', os: 'linux', command: 'sudo', category: 'Administrative', style: 'scenario',
      q: 'Your company disabled direct root logins for accountability, so admins must use their own accounts. You need to restart the cups printing service. Type the command with the elevation prefix: systemctl restart cups.',
      answers: ['sudo systemctl restart cups'],
      hint: 'You run one command elevated, and the log records your name.',
      why: 'sudo elevates one command with your own password and logs who did it, which a shared root password cannot do.',
      output: R`
[sudo] password for student:
student@ubuntu:~$ systemctl is-active cups
active`,
    },

    // ---- Package management: apt ----
    {
      id: 'l-apt-1', os: 'linux', command: 'apt', category: 'Package management', style: 'recall',
      q: 'On Ubuntu, which command refreshes the list of available packages from the repositories? Type it with sudo.',
      answers: ['sudo apt update', 'sudo apt-get update'],
      hint: 'Debian/Ubuntu package manager. First you refresh the package index.',
      why: "apt update downloads the latest package lists; it doesn't install anything by itself.",
      output: R`
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
Get:3 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
Fetched 1,214 kB in 2s (607 kB/s)
Reading package lists... Done
Building dependency tree... Done
14 packages can be upgraded. Run 'apt list --upgradable' to see them.`,
    },
    {
      id: 'l-apt-2', os: 'linux', command: 'apt', category: 'Package management', style: 'scenario',
      q: 'A technician needs the nmap network scanner on an Ubuntu workstation. Type the command with sudo that installs the nmap package.',
      answers: ['sudo apt install nmap', 'sudo apt-get install nmap', 'sudo apt install -y nmap', 'sudo apt-get install -y nmap'],
      hint: 'Ubuntu is Debian-based. Use its package manager and the verb for adding software.',
      why: 'apt install downloads the package and its dependencies from the repositories and installs them.',
      output: R`
Reading package lists... Done
Building dependency tree... Done
The following NEW packages will be installed:
  libblas3 liblinear4 nmap nmap-common
0 upgraded, 4 newly installed, 0 to remove and 14 not upgraded.
Need to get 6,034 kB of archives.
Setting up nmap (7.94+git20230807.3be01efb1+dfsg-3build2) ...`,
    },
    {
      id: 'l-apt-3', os: 'linux', command: 'apt', category: 'Package management', style: 'scenario',
      q: 'The package list on an Ubuntu server is already refreshed, and 14 packages have updates waiting, including security patches. Type the command with sudo that installs the available updates.',
      answers: ['sudo apt upgrade', 'sudo apt-get upgrade', 'sudo apt upgrade -y', 'sudo apt-get upgrade -y', 'sudo apt full-upgrade'],
      hint: 'Refreshing the list is not the same as installing what it found.',
      why: 'apt upgrade installs newer versions of installed packages (run apt update first so the list is current).',
      output: R`
Reading package lists... Done
Calculating upgrade... Done
The following packages will be upgraded:
  libssl3t64 openssl openssh-client openssh-server ...
14 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
Do you want to continue? [Y/n] Y`,
    },

    // ---- Package management: dnf ----
    {
      id: 'l-dnf-1', os: 'linux', command: 'dnf', category: 'Package management', style: 'recall',
      q: 'On Fedora or Red Hat Enterprise Linux, which command installs the httpd package? Type it with sudo.',
      answers: ['sudo dnf install httpd', 'sudo dnf install -y httpd', 'sudo dnf -y install httpd'],
      hint: 'Red Hat-family distributions use a different package manager than Ubuntu.',
      why: 'dnf is the package manager for Fedora/RHEL; dnf install resolves dependencies and installs the package.',
      output: R`
Last metadata expiration check: 0:12:40 ago on Sun 15 Nov 2026 09:58:02 AM UTC.
Dependencies resolved.
================================================================================
 Package           Architecture  Version                  Repository      Size
================================================================================
Installing:
 httpd             x86_64        2.4.62-1.fc41            updates         47 k
Transaction Summary
================================================================================
Install  6 Packages
Complete!`,
    },
    {
      id: 'l-dnf-2', os: 'linux', command: 'dnf', category: 'Package management', style: 'scenario',
      q: 'A Fedora workstation has not been patched in months. Type the command with sudo that upgrades every installed package to the latest available version.',
      answers: ['sudo dnf upgrade', 'sudo dnf update', 'sudo dnf upgrade -y', 'sudo dnf update -y', 'sudo dnf -y upgrade', 'sudo dnf -y update'],
      hint: 'Fedora is Red Hat-family. Use its package manager to bring everything up to date.',
      why: 'dnf upgrade (dnf update is an alias) refreshes metadata and installs all available updates.',
      output: R`
Last metadata expiration check: 0:03:11 ago on Sun 15 Nov 2026 10:20:44 AM UTC.
Dependencies resolved.
Upgrading:
 firefox           x86_64   132.0.2-1.fc41   updates    69 M
 kernel            x86_64   6.11.8-300.fc41  updates   156 k
 openssl-libs      x86_64   1:3.2.2-9.fc41   updates   2.3 M
Transaction Summary
Upgrade  128 Packages
Is this ok [y/N]: y
Complete!`,
    },

    // ---- Network: ip ----
    {
      id: 'l-ip-1', os: 'linux', command: 'ip', category: 'Network', style: 'recall',
      q: 'Which command shows the IP addresses assigned to every network interface on a modern Linux system? Type ip with its address object.',
      answers: ['ip addr', 'ip a', 'ip address', 'ip addr show', 'ip address show', 'ip a show'],
      hint: 'The modern replacement for ifconfig is a two-letter command; ask it about addresses.',
      why: 'ip addr lists each interface with its IPv4/IPv6 addresses, MAC address, and state.',
      output: R`
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 52:54:00:3a:9c:e1 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.57/24 brd 192.168.1.255 scope global dynamic eth0
       valid_lft 85912sec preferred_lft 85912sec`,
    },
    {
      id: 'l-ip-2', os: 'linux', command: 'ip', category: 'Network', style: 'scenario',
      q: 'A Linux workstation reaches local hosts but nothing on the internet. You suspect the default gateway is missing. Type ip with the object that displays the routing table.',
      answers: ['ip route', 'ip r', 'ip route show', 'ip r show'],
      hint: 'Same network command, but ask about routing instead of addresses.',
      why: 'ip route shows the routing table; a working setup has a "default via <gateway>" line.',
      output: R`
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.57
169.254.0.0/16 dev eth0 scope link metric 1000`,
    },
    {
      id: 'l-ip-3', os: 'linux', command: 'ip', category: 'Network', style: 'scenario',
      q: 'The eth0 interface shows "state DOWN" after maintenance. Type the ip command with sudo that brings the eth0 link up.',
      answers: ['sudo ip link set eth0 up', 'sudo ip link set dev eth0 up'],
      hint: 'Interfaces are the "link" object. You set its state.',
      why: 'ip link set eth0 up enables the interface (changing interface state requires root).',
      output: R`
student@ubuntu:~$ ip link show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 52:54:00:3a:9c:e1 brd ff:ff:ff:ff:ff:ff`,
    },

    // ---- Network: ping ----
    {
      id: 'l-ping-1', os: 'linux', command: 'ping', category: 'Network', style: 'recall',
      q: 'On Linux, ping runs until you press Ctrl+C. Which command sends exactly 4 echo requests to 8.8.8.8? Type it with the count option.',
      answers: ['ping -c 4 8.8.8.8', 'ping 8.8.8.8 -c 4', 'ping -c4 8.8.8.8'],
      hint: 'The option stands for "count."',
      why: 'ping -c 4 stops after four replies, the same as the Windows default.',
      output: R`
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=13.9 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=14.2 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=117 time=13.7 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=117 time=14.0 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 13.7/13.9/14.2/0.2 ms`,
    },
    {
      id: 'l-ping-2', os: 'linux', command: 'ping', category: 'Network', style: 'scenario',
      q: 'A Linux server cannot download updates. You first want to confirm it can reach its gateway at 192.168.1.1 at all. Type the reachability test with that address (no options; you will stop it with Ctrl+C).',
      answers: ['ping 192.168.1.1'],
      hint: 'Start with the most basic ICMP test.',
      why: 'ping to the gateway checks local connectivity first; if that fails, look at cabling, IP settings, or the switch.',
      output: R`
PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=0.612 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=0.540 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=0.587 ms
^C
--- 192.168.1.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms`,
    },

    // ---- Network: curl ----
    {
      id: 'l-curl-1', os: 'linux', command: 'curl', category: 'Network', style: 'recall',
      q: 'Which command fetches the web page at https://example.com and prints it in the terminal? Type it with that URL.',
      answers: ['curl https://example.com', 'curl https://example.com/'],
      hint: 'A command-line tool that transfers data to or from a URL.',
      why: 'curl requests the URL and writes the response body to the terminal.',
      output: R`
<!doctype html>
<html>
<head>
    <title>Example Domain</title>
...
</html>`,
    },
    {
      id: 'l-curl-2', os: 'linux', command: 'curl', category: 'Network', style: 'scenario',
      q: 'The intranet site https://intranet.local seems to redirect users somewhere unexpected. You want to see only the HTTP response headers (status code, Location, Server), not the page body. Type curl with the option for headers only.',
      answers: ['curl -I https://intranet.local', 'curl --head https://intranet.local', 'curl -I https://intranet.local/'],
      hint: 'You want a HEAD request: just the headers.',
      why: 'curl -I sends a HEAD request and prints only the status line and headers.',
      output: R`
HTTP/1.1 302 Found
Date: Sun, 15 Nov 2026 10:44:12 GMT
Server: nginx/1.24.0 (Ubuntu)
Location: https://sso.corp.local/login?next=/
Content-Length: 0`,
    },
    {
      id: 'l-curl-3', os: 'linux', command: 'curl', category: 'Network', style: 'scenario',
      q: 'You need to download the installer at https://downloads.example.com/agent.deb and save it under its original file name. Type curl with the option that does that.',
      answers: ['curl -O https://downloads.example.com/agent.deb', 'curl --remote-name https://downloads.example.com/agent.deb', 'curl -LO https://downloads.example.com/agent.deb', 'curl -L -O https://downloads.example.com/agent.deb', 'curl -O -L https://downloads.example.com/agent.deb'],
      hint: 'There is an uppercase letter option that keeps the remote file name.',
      why: 'curl -O writes the download to a local file named like the remote one (agent.deb).',
      output: R`
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 18.2M  100 18.2M    0     0  24.1M      0 --:--:-- --:--:-- --:--:-- 24.1M`,
    },

    // ---- Network: dig ----
    {
      id: 'l-dig-1', os: 'linux', command: 'dig', category: 'Network', style: 'recall',
      q: 'Which Linux command queries DNS and shows the full answer section for example.net? Type it with that domain.',
      answers: ['dig example.net'],
      hint: 'Its name suggests digging into DNS.',
      why: 'dig queries the configured DNS server and prints the question, answer, and server details.',
      output: R`
; <<>> DiG 9.18.28-0ubuntu0.24.04.1-Ubuntu <<>> example.net
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 40213

;; ANSWER SECTION:
example.net.		300	IN	A	192.0.2.10
example.net.		300	IN	A	192.0.2.11

;; Query time: 21 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)`,
    },
    {
      id: 'l-dig-2', os: 'linux', command: 'dig', category: 'Network', style: 'scenario',
      q: 'Email to example.org keeps bouncing, and you suspect its mail exchanger records are wrong. Type dig with the domain example.org and the record type for mail servers.',
      answers: ['dig example.org MX', 'dig MX example.org', 'dig -t MX example.org', 'dig example.org mx', 'dig mx example.org', 'dig -t mx example.org'],
      hint: 'Ask the DNS tool for the specific record type that points to mail servers.',
      why: 'dig example.org MX returns the mail exchanger records and their priorities.',
      output: R`
;; ANSWER SECTION:
example.org.		3600	IN	MX	10 mail1.example.org.
example.org.		3600	IN	MX	20 mail2.example.org.

;; Query time: 34 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)`,
    },

    // ---- Network: traceroute ----
    {
      id: 'l-traceroute-1', os: 'linux', command: 'traceroute', category: 'Network', style: 'recall',
      q: 'Which Linux command shows every router hop between you and example.net? Type it with that destination.',
      answers: ['traceroute example.net'],
      hint: 'Trace the route. On Linux the full word is spelled out (unlike Windows).',
      why: 'traceroute raises the TTL hop by hop to reveal each router on the path.',
      output: R`
traceroute to example.net (192.0.2.10), 30 hops max, 60 byte packets
 1  _gateway (192.168.1.1)  0.611 ms  0.540 ms  0.512 ms
 2  10.64.0.1 (10.64.0.1)  8.120 ms  8.402 ms  8.330 ms
 3  isp-core1.example.net (198.51.100.9)  11.207 ms  11.180 ms  11.391 ms
 4  192.0.2.10 (192.0.2.10)  12.904 ms  12.811 ms  12.877 ms`,
    },
    {
      id: 'l-traceroute-2', os: 'linux', command: 'traceroute', category: 'Network', style: 'scenario',
      q: 'From a Linux server, the backup target 203.0.113.80 is unreachable, but the local gateway answers pings. You want to find the hop where packets stop. Type the command with that address.',
      answers: ['traceroute 203.0.113.80'],
      hint: 'Ping only says "unreachable." You want to see each hop along the way.',
      why: 'traceroute shows how far packets get; the last responding hop is where to investigate.',
      output: R`
traceroute to 203.0.113.80 (203.0.113.80), 30 hops max, 60 byte packets
 1  _gateway (192.168.1.1)  0.598 ms  0.532 ms  0.504 ms
 2  10.64.0.1 (10.64.0.1)  8.233 ms  8.198 ms  8.410 ms
 3  * * *
 4  * * *
 5  * * *`,
    },

    // ---- Informational: man ----
    {
      id: 'l-man-1', os: 'linux', command: 'man', category: 'Informational', style: 'recall',
      q: 'Which command opens the manual page for chmod? Type it with the command name.',
      answers: ['man chmod'],
      hint: 'Short for "manual."',
      why: 'man chmod shows the full reference: synopsis, options, and examples. Press q to quit.',
      output: R`
CHMOD(1)                         User Commands                        CHMOD(1)

NAME
       chmod - change file mode bits

SYNOPSIS
       chmod [OPTION]... MODE[,MODE]... FILE...
       chmod [OPTION]... OCTAL-MODE FILE...

DESCRIPTION
       This manual page documents the GNU version of chmod. ...
 Manual page chmod(1) line 1 (press h for help or q to quit)`,
    },
    {
      id: 'l-man-2', os: 'linux', command: 'man', category: 'Informational', style: 'scenario',
      q: 'You need to know which tar option compresses with gzip, and the server has no internet access. Type the command that opens the built-in reference documentation for tar.',
      answers: ['man tar'],
      hint: 'Linux ships its documentation offline as manual pages.',
      why: 'man pages are installed locally, so they work without internet access.',
      output: R`
TAR(1)                           GNU TAR Manual                         TAR(1)

NAME
       tar - an archiving utility
...
       -z, --gzip, --gunzip, --ungzip
              Filter the archive through gzip(1).
 Manual page tar(1) line 1 (press h for help or q to quit)`,
    },

    // ---- Informational: cat ----
    {
      id: 'l-cat-1', os: 'linux', command: 'cat', category: 'Informational', style: 'recall',
      q: 'Which command prints the contents of notes.txt to the terminal? Type it with the file name.',
      answers: ['cat notes.txt'],
      hint: 'Short for "concatenate," it prints whole files.',
      why: 'cat writes the file contents straight to the terminal.',
      output: R`
- Order replacement toner for 2nd floor printer
- Re-image LT-0457 on Tuesday
- Study chmod numeric permissions`,
    },
    {
      id: 'l-cat-2', os: 'linux', command: 'cat', category: 'Informational', style: 'scenario',
      q: 'A log was split into part1.log and part2.log. You want to print both, one after the other, to review them as one continuous log. Type the command with both file names in order.',
      answers: ['cat part1.log part2.log'],
      hint: 'Its name literally means joining things end to end.',
      why: 'cat concatenates the files in the order given; add "> full.log" to save the result.',
      output: R`
2026-11-15 06:00:01 backup started
2026-11-15 06:20:44 backup 50% complete
2026-11-15 06:41:09 backup finished OK`,
    },

    // ---- Informational: top ----
    {
      id: 'l-top-1', os: 'linux', command: 'top', category: 'Informational', style: 'recall',
      q: 'Which command shows a live, continuously updating list of processes sorted by CPU usage?',
      answers: ['top'],
      hint: 'You want a live view that keeps refreshing, not a one-time snapshot.',
      why: 'top refreshes every few seconds with load average, memory, and the busiest processes. Press q to quit.',
      output: R`
top - 10:52:14 up 3 days,  2:11,  1 user,  load average: 3.92, 2.10, 1.04
Tasks: 212 total,   2 running, 210 sleeping,   0 stopped,   0 zombie
%Cpu(s): 97.8 us,  1.4 sy,  0.0 ni,  0.6 id,  0.0 wa,  0.0 hi,  0.2 si
MiB Mem :   7951.2 total,    412.6 free,   5208.1 used,   2330.5 buff/cache

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   4821 student   20   0 3412084 812440  98112 R  94.7  10.0  21:07.33 python3
   1093 root      20   0  392144  52116  31220 S   1.3   0.6   1:12.08 Xorg
      1 root      20   0  168508  13112   8420 S   0.0   0.2   0:03.41 systemd`,
    },
    {
      id: 'l-top-2', os: 'linux', command: 'top', category: 'Informational', style: 'scenario',
      q: 'A Linux desktop became sluggish a few minutes ago. You want to watch, in real time, which process is consuming the most CPU and memory. Which command?',
      answers: ['top'],
      hint: 'You want a live view, not a one-time snapshot.',
      why: 'top updates continuously and sorts the heaviest processes first, so the culprit is at the top.',
      output: R`
top - 11:03:40 up 3 days,  2:22,  1 user,  load average: 4.01, 3.55, 2.20
Tasks: 214 total,   3 running, 211 sleeping,   0 stopped,   0 zombie
%Cpu(s): 88.1 us,  4.0 sy,  0.0 ni,  7.9 id,  0.0 wa,  0.0 hi,  0.0 si

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   5120 student   20   0   11.2g   3.1g 210440 R 182.3  39.9  14:51.02 firefox
   1093 root      20   0  392144  52116  31220 S   2.0   0.6   1:13.40 Xorg`,
    },

    // ---- Informational: ps ----
    {
      id: 'l-ps-1', os: 'linux', command: 'ps', category: 'Informational', style: 'recall',
      q: 'Which command lists a snapshot of every process on the system, for all users, with its owner and PID? Type ps with the options for that (either common style is accepted).',
      answers: ['ps aux', 'ps -ef', 'ps -aux', 'ps -e', 'ps -A'],
      hint: 'The process-status command lists only your terminal by default. Add options for every user.',
      why: 'ps aux (BSD style) or ps -ef (System V style) lists all processes, not just your own.',
      output: R`
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.1 168508 13112 ?        Ss   Nov12   0:03 /sbin/init
root         812  0.0  0.0  15420  6012 ?        Ss   Nov12   0:00 sshd: /usr/sbin/sshd -D
student     4821 94.7 10.0 3412084 812440 pts/0  R    10:31  21:07 python3 report.py
student     5301  0.0  0.0  11284  4480 pts/1    R+   11:05   0:00 ps aux`,
    },
    {
      id: 'l-ps-2', os: 'linux', command: 'ps', category: 'Informational', style: 'scenario',
      q: 'You want a quick snapshot of just the processes running in your current terminal session, to find the PID of a script you started from it. Type the command with no options.',
      answers: ['ps'],
      hint: 'A one-time snapshot, not a live view. With no options it shows only your terminal.',
      why: 'Plain ps lists the processes attached to your current terminal with their PIDs.',
      output: R`
    PID TTY          TIME CMD
   4790 pts/0    00:00:00 bash
   4821 pts/0    00:21:07 python3
   5310 pts/0    00:00:00 ps`,
    },

    // ---- Informational: du ----
    {
      id: 'l-du-1', os: 'linux', command: 'du', category: 'Informational', style: 'recall',
      q: 'Which command reports the total disk space used by the Downloads directory as a single human-readable number? Type it with the summary and human-readable options.',
      answers: ['du -sh Downloads', 'du -hs Downloads', 'du -s -h Downloads', 'du -h -s Downloads', 'du -sh Downloads/', 'du -sh ~/Downloads'],
      hint: 'Disk usage, summarized, in human units.',
      why: 'du -sh prints one total for the directory in K/M/G instead of listing every subfolder.',
      output: R`
4.7G	Downloads`,
    },
    {
      id: 'l-du-2', os: 'linux', command: 'du', category: 'Informational', style: 'scenario',
      q: 'The root file system is nearly full and you suspect /var/log has grown huge. Type the command with sudo that shows the total size of /var/log in human-readable form (summary only).',
      answers: ['sudo du -sh /var/log', 'sudo du -hs /var/log', 'sudo du -s -h /var/log', 'sudo du -h -s /var/log', 'sudo du -sh /var/log/'],
      hint: 'You want how much space one directory uses, summarized, not free space for the whole disk.',
      why: 'du measures what a specific directory consumes; sudo lets it read protected log folders.',
      output: R`
18G	/var/log`,
    },

    // ---- Informational: df ----
    {
      id: 'l-df-1', os: 'linux', command: 'df', category: 'Informational', style: 'recall',
      q: 'Which command shows used and available space on every mounted file system in human-readable units? Type it with that option.',
      answers: ['df -h'],
      hint: 'Disk free, in human units.',
      why: 'df -h lists each mounted file system with size, used, available, and use percentage.',
      output: R`
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           796M  2.1M  794M   1% /run
/dev/sda2        98G   41G   52G  45% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
/dev/sda1       1.1G  6.2M  1.1G   1% /boot/efi
/dev/sdb1       916G  512G  358G  59% /mnt/data`,
    },
    {
      id: 'l-df-2', os: 'linux', command: 'df', category: 'Informational', style: 'scenario',
      q: 'Package installs fail with "No space left on device." Before hunting for big directories, you want to see how full each mounted file system is. Type the command with the human-readable option.',
      answers: ['df -h'],
      hint: 'You want free space per file system, not the size of one directory.',
      why: 'df -h shows which file system is full, so you know where to clean up.',
      output: R`
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           796M  2.1M  794M   1% /run
/dev/sda2        98G   98G     0 100% /
/dev/sda1       1.1G  6.2M  1.1G   1% /boot/efi`,
    },

    // ---- Text editor: nano ----
    {
      id: 'l-nano-1', os: 'linux', command: 'nano', category: 'Text editor', style: 'recall',
      q: 'Which simple terminal text editor opens todo.txt for editing, with its shortcuts listed at the bottom of the screen? Type it with the file name.',
      answers: ['nano todo.txt'],
      hint: 'A beginner-friendly editor whose name sounds tiny.',
      why: 'nano opens the file in a simple editor; Ctrl+O saves and Ctrl+X exits.',
      output: R`
  GNU nano 7.2                         todo.txt
- Order replacement toner
- Re-image LT-0457



^G Help      ^O Write Out ^W Where Is  ^K Cut       ^T Execute   ^C Location
^X Exit      ^R Read File ^\ Replace   ^U Paste     ^J Justify   ^/ Go To Line`,
    },
    {
      id: 'l-nano-2', os: 'linux', command: 'nano', category: 'Text editor', style: 'scenario',
      q: 'A junior technician needs to change one line in a script, deploy.sh, on a server with no GUI and has never used vi. Which beginner-friendly editor should they open it with? Type it with the file name.',
      answers: ['nano deploy.sh'],
      hint: 'Pick the editor that shows its shortcut keys on screen.',
      why: 'nano is the friendliest terminal editor: no modes, and its shortcuts are always visible.',
      output: R`
  GNU nano 7.2                         deploy.sh
#!/bin/bash
rsync -av ./site/ /var/www/html/


^G Help      ^O Write Out ^W Where Is  ^K Cut       ^T Execute   ^C Location
^X Exit      ^R Read File ^\ Replace   ^U Paste     ^J Justify   ^/ Go To Line`,
    },

    // ---- Configuration files: /etc/passwd ----
    {
      id: 'l-passwd-1', os: 'linux', command: '/etc/passwd', category: 'Configuration files', style: 'recall',
      q: 'Which file lists every user account with its UID, home directory, and login shell? Display it with cat (type the full path).',
      answers: ['cat /etc/passwd'],
      hint: 'System config lives in /etc. This file is named after what used to be stored in it.',
      why: '/etc/passwd holds one line per account; despite its name it no longer stores passwords.',
      output: R`
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
student:x:1000:1000:Student,,,:/home/student:/bin/bash
alice:x:1001:1001:Alice Ng,,,:/home/alice:/bin/bash`,
    },
    {
      id: 'l-passwd-2', os: 'linux', command: '/etc/passwd', category: 'Configuration files', style: 'scenario',
      q: "You just created an account for bob and want to confirm it exists and check its login shell. Type grep with bob and the full path of the file that holds account entries.",
      answers: ['grep bob /etc/passwd', 'grep "bob" /etc/passwd', "grep 'bob' /etc/passwd", 'grep ^bob /etc/passwd', 'grep "^bob" /etc/passwd'],
      hint: 'Search the world-readable account list in /etc for that user name.',
      why: '/etc/passwd has one line per account, so grep shows bob\'s UID, home directory, and shell.',
      output: R`
bob:x:1002:1002:Bob Ortiz,,,:/home/bob:/bin/bash`,
    },

    // ---- Configuration files: /etc/shadow ----
    {
      id: 'l-shadow-1', os: 'linux', command: '/etc/shadow', category: 'Configuration files', style: 'recall',
      q: 'Which file stores the hashed user passwords and is readable only by root? Display it with sudo cat (type the full path).',
      answers: ['sudo cat /etc/shadow'],
      hint: 'Passwords were moved out of the account file into a protected file in /etc whose name suggests hiding.',
      why: '/etc/shadow holds password hashes and aging rules; only root can read it, so you need sudo.',
      output: R`
[sudo] password for student:
root:*:20012:0:99999:7:::
daemon:*:20012:0:99999:7:::
student:$y$j9T$Qv1x...a8Fz/:20380:0:99999:7:::
alice:$y$j9T$7Hk2...L0pQ.:20402:0:90:7:::`,
    },
    {
      id: 'l-shadow-2', os: 'linux', command: '/etc/shadow', category: 'Configuration files', style: 'scenario',
      q: "An auditor asks whether the account bob has a password set and when it must be changed. Type grep with sudo, the name bob, and the full path of the file that stores password hashes and aging rules.",
      answers: ['sudo grep bob /etc/shadow', 'sudo grep "bob" /etc/shadow', "sudo grep 'bob' /etc/shadow", 'sudo grep ^bob /etc/shadow', 'sudo grep "^bob" /etc/shadow'],
      hint: 'Password hashes are not in the world-readable account file. Look in the protected one, with elevation.',
      why: "/etc/shadow's second field is the hash (! or * means locked or no password) and later fields are aging rules.",
      output: R`
bob:!:20407:0:90:7:::`,
    },

    // ---- Configuration files: /etc/hosts ----
    {
      id: 'l-hosts-1', os: 'linux', command: '/etc/hosts', category: 'Configuration files', style: 'recall',
      q: 'Which file maps host names to IP addresses locally, and is usually checked before DNS? Display it with cat (type the full path).',
      answers: ['cat /etc/hosts'],
      hint: 'Same name as the Windows file that does this job, but it lives in /etc.',
      why: '/etc/hosts entries override DNS for the names they list.',
      output: R`
127.0.0.1	localhost
127.0.1.1	ubuntu
192.168.1.20	intranet.local intranet

# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback`,
    },
    {
      id: 'l-hosts-2', os: 'linux', command: '/etc/hosts', category: 'Configuration files', style: 'scenario',
      q: 'Before DNS is updated, you must point testsite.local at 10.0.0.25 on one Linux machine only. Type the command that opens the local name-mapping file in nano with root privileges (full path).',
      answers: ['sudo nano /etc/hosts'],
      hint: 'You need the local file that overrides DNS, opened in an editor with elevation.',
      why: 'An entry in /etc/hosts resolves the name on this machine only, without touching DNS.',
      output: R`
  GNU nano 7.2                         /etc/hosts
127.0.0.1	localhost
127.0.1.1	ubuntu
10.0.0.25	testsite.local

^G Help      ^O Write Out ^W Where Is  ^K Cut       ^T Execute   ^C Location
^X Exit      ^R Read File ^\ Replace   ^U Paste     ^J Justify   ^/ Go To Line`,
    },

    // ---- Configuration files: /etc/fstab ----
    {
      id: 'l-fstab-1', os: 'linux', command: '/etc/fstab', category: 'Configuration files', style: 'recall',
      q: 'Which file lists the file systems to mount automatically at boot? Display it with cat (type the full path).',
      answers: ['cat /etc/fstab'],
      hint: 'The file system table, abbreviated, in /etc.',
      why: '/etc/fstab defines each boot-time mount: device or UUID, mount point, type, options, dump, and pass.',
      output: R`
# <file system>                           <mount point>  <type>  <options>  <dump>  <pass>
UUID=7c1e6a2b-1d4f-4f5e-9a51-0c6a2e9f8b31 /              ext4    defaults   0       1
UUID=4A1E-93C2                            /boot/efi      vfat    umask=0077 0       1
/swap.img                                 none           swap    sw         0       0`,
    },
    {
      id: 'l-fstab-2', os: 'linux', command: '/etc/fstab', category: 'Configuration files', style: 'scenario',
      q: 'A data disk mounted manually at /mnt/data disappears after every reboot. Type the command that opens the boot-time mount configuration file in nano with root privileges (full path).',
      answers: ['sudo nano /etc/fstab'],
      hint: 'Manual mounts are lost at reboot. Permanent ones belong in the file system table.',
      why: 'Adding a line to /etc/fstab makes the mount happen automatically at boot.',
      output: R`
  GNU nano 7.2                         /etc/fstab
UUID=7c1e6a2b-1d4f-4f5e-9a51-0c6a2e9f8b31 /          ext4  defaults  0  1
UUID=4A1E-93C2                            /boot/efi  vfat  umask=0077 0 1
UUID=e2b9c0d4-8812-4a0e-b3cc-91f05a7d1e66 /mnt/data  ext4  defaults  0  2

^G Help      ^O Write Out ^W Where Is  ^K Cut       ^T Execute   ^C Location
^X Exit      ^R Read File ^\ Replace   ^U Paste     ^J Justify   ^/ Go To Line`,
    },

    // ---- Configuration files: /etc/resolv.conf ----
    {
      id: 'l-resolv-1', os: 'linux', command: '/etc/resolv.conf', category: 'Configuration files', style: 'recall',
      q: 'Which file lists the DNS name servers and search domain that a Linux system uses? Display it with cat (type the full path).',
      answers: ['cat /etc/resolv.conf'],
      hint: 'The file in /etc named after the resolver that turns names into addresses.',
      why: '/etc/resolv.conf contains "nameserver" lines and the search domain used by the resolver.',
      output: R`
# This is /run/systemd/resolve/stub-resolv.conf managed by man:systemd-resolved(8).
nameserver 127.0.0.53
options edns0 trust-ad
search corp.local`,
    },
    {
      id: 'l-resolv-2', os: 'linux', command: '/etc/resolv.conf', category: 'Configuration files', style: 'scenario',
      q: 'A Linux workstation can ping 8.8.8.8 but cannot resolve any names. You want to check which name server it is configured to use. Display the resolver configuration file with cat (type the full path).',
      answers: ['cat /etc/resolv.conf'],
      hint: 'Pinging by IP works, so look at the file that tells the system where to send DNS queries.',
      why: 'A wrong or unreachable "nameserver" entry in /etc/resolv.conf breaks name resolution while IP connectivity still works.',
      output: R`
nameserver 10.99.99.99
search corp.local`,
    },

    // ===================================================================
    // macOS  (prompt student@MacBook ~ %)
    // ===================================================================

    // ---- File management: ls ----
    {
      id: 'm-ls-1', os: 'macos', command: 'ls', category: 'File management', style: 'recall',
      q: 'Which command lists the contents of the system-wide /Applications folder? Type it with that path.',
      answers: ['ls /Applications', 'ls /Applications/'],
      hint: 'Two letters, short for "list," followed by the folder.',
      why: 'ls with a path lists that folder without changing your current location.',
      output: R`
App Store.app         Calculator.app        Microsoft Teams.app   Safari.app
Books.app             FaceTime.app          Notes.app             System Settings.app
Calendar.app          Google Chrome.app     Numbers.app           Utilities`,
    },
    {
      id: 'm-ls-2', os: 'macos', command: 'ls', category: 'File management', style: 'scenario',
      q: 'A Mac is shared by several people, and you want to see which home folders exist, with their owners and permissions. Type ls with the long-format option and the folder that holds every user\'s home folder.',
      answers: ['ls -l /Users', 'ls -l /Users/'],
      hint: 'Home folders live in a top-level folder named for the people who use the Mac. Ask for the long listing.',
      why: 'ls -l /Users shows each home folder with its owner, so you can match folders to accounts.',
      output: R`
total 0
drwxr-x---+ 14 jlee     staff   448 Nov 10 09:02 jlee
drwxrwxrwt   7 root     wheel   224 Nov 14 18:20 Shared
drwxr-x---+ 21 student  staff   672 Nov 15 08:44 student`,
    },
    {
      id: 'm-ls-3', os: 'macos', command: 'ls', category: 'File management', style: 'scenario',
      q: "Finder hides dotfiles, and you need to check whether your home folder has a .zshrc file. Type ls with the option that shows hidden files.",
      answers: ['ls -a', 'ls -A'],
      hint: 'Names starting with a dot are hidden. Ask for all of them.',
      why: 'ls -a includes dotfiles such as .zshrc and .ssh that Finder hides by default.',
      output: R`
.              .Trash         .zsh_history   Desktop        Downloads      Movies         Pictures
..             .ssh           .zshrc         Documents      Library        Music          Public`,
    },

    // ---- File management: pwd ----
    {
      id: 'm-pwd-1', os: 'macos', command: 'pwd', category: 'File management', style: 'recall',
      q: 'In the macOS Terminal, which command prints the full path of the folder you are currently in?',
      answers: ['pwd'],
      hint: 'Print working directory.',
      why: 'pwd prints the absolute path. Your home folder on macOS is /Users/<username>.',
      output: R`
/Users/student`,
    },
    {
      id: 'm-pwd-2', os: 'macos', command: 'pwd', category: 'File management', style: 'scenario',
      q: 'The zsh prompt only shows "Preferences," and a support article needs to know the full path you are in. Which command shows it?',
      answers: ['pwd'],
      hint: 'The prompt shortens your location. Ask the shell to print the whole thing.',
      why: 'pwd prints the full path even when the prompt only shows the last folder name.',
      output: R`
/Users/student/Library/Preferences`,
    },

    // ---- File management: mv ----
    {
      id: 'm-mv-1', os: 'macos', command: 'mv', category: 'File management', style: 'recall',
      q: 'Which command renames draft.txt to final.txt? Type it with both names.',
      answers: ['mv draft.txt final.txt'],
      hint: 'There is no separate rename command; you move the file to a new name.',
      why: 'mv with a new name in the same folder renames the file.',
      output: R`
student@MacBook ~ % ls
final.txt`,
    },
    {
      id: 'm-mv-2', os: 'macos', command: 'mv', category: 'File management', style: 'scenario',
      q: 'You are in your home folder. Move report.pdf from Downloads into Documents (both folders are in your home). Type the command with the paths Downloads/report.pdf and Documents.',
      answers: ['mv Downloads/report.pdf Documents', 'mv Downloads/report.pdf Documents/', 'mv ~/Downloads/report.pdf ~/Documents', 'mv ~/Downloads/report.pdf ~/Documents/'],
      hint: 'You want it gone from Downloads and present in Documents, not a duplicate.',
      why: 'mv relocates the file; it no longer exists in Downloads afterward.',
      output: R`
student@MacBook ~ % ls Documents
report.pdf  taxes-2025.numbers`,
    },

    // ---- File management: cp ----
    {
      id: 'm-cp-1', os: 'macos', command: 'cp', category: 'File management', style: 'recall',
      q: 'Which command makes a copy of notes.txt named notes-copy.txt in the same folder? Type it with both names.',
      answers: ['cp notes.txt notes-copy.txt'],
      hint: 'Two letters, short for "copy."',
      why: 'cp source destination duplicates the file and leaves the original in place.',
      output: R`
student@MacBook ~ % ls
notes-copy.txt  notes.txt`,
    },
    {
      id: 'm-cp-2', os: 'macos', command: 'cp', category: 'File management', style: 'scenario',
      q: 'Before resetting an app, you want to back up your entire Preferences folder (~/Library/Preferences) to ~/Desktop/prefs-backup, including everything inside it. Type cp with the option that copies folders recursively.',
      answers: ['cp -R ~/Library/Preferences ~/Desktop/prefs-backup', 'cp -r ~/Library/Preferences ~/Desktop/prefs-backup', 'cp -a ~/Library/Preferences ~/Desktop/prefs-backup'],
      hint: 'The copy command skips folders unless you tell it to work recursively.',
      why: 'cp -R copies the folder and everything inside it. The user Library holds per-user app settings.',
      output: R`
student@MacBook ~ % ls ~/Desktop/prefs-backup | head -3
com.apple.dock.plist
com.apple.finder.plist
com.microsoft.teams2.plist`,
    },

    // ---- File management: rm ----
    {
      id: 'm-rm-1', os: 'macos', command: 'rm', category: 'File management', style: 'recall',
      q: 'Which command deletes the file old-notes.txt? Type it with the file name.',
      answers: ['rm old-notes.txt'],
      hint: 'Two letters, short for "remove."',
      why: 'rm deletes immediately; unlike dragging to the Trash, there is no undo.',
      output: R`
student@MacBook ~ % ls old-notes.txt
ls: old-notes.txt: No such file or directory`,
    },
    {
      id: 'm-rm-2', os: 'macos', command: 'rm', category: 'File management', style: 'scenario',
      q: 'An uninstalled app left its OldApp.app bundle stuck in /Applications, and Finder will not move it to the Trash. App bundles are really folders. Type rm with sudo and the recursive option to delete /Applications/OldApp.app.',
      answers: ['sudo rm -r /Applications/OldApp.app', 'sudo rm -R /Applications/OldApp.app', 'sudo rm -rf /Applications/OldApp.app', 'sudo rm -fr /Applications/OldApp.app', 'sudo rm -Rf /Applications/OldApp.app'],
      hint: 'A .app is a folder, so delete recursively, with elevation because /Applications is system-wide.',
      why: '.app bundles are directories, so rm needs -r, and /Applications is owned by root, so it needs sudo.',
      output: R`
Password:
student@MacBook ~ % ls /Applications | grep OldApp
student@MacBook ~ %`,
    },

    // ---- File management: chmod ----
    {
      id: 'm-chmod-1', os: 'macos', command: 'chmod', category: 'File management', style: 'recall',
      q: 'Using numeric permissions, set cleanup.sh to rwxr-xr-x. Type the command.',
      answers: ['chmod 755 cleanup.sh'],
      hint: 'r=4, w=2, x=1. Add them up for the owner, group, and others.',
      why: 'rwx = 7 and r-x = 5, so rwxr-xr-x is 755.',
      output: R`
student@MacBook ~ % ls -l cleanup.sh
-rwxr-xr-x  1 student  staff  640 Nov 15 09:30 cleanup.sh`,
    },
    {
      id: 'm-chmod-2', os: 'macos', command: 'chmod', category: 'File management', style: 'scenario',
      q: 'You downloaded a script, setup.sh, but running ./setup.sh gives "permission denied." Type chmod in symbolic form to add execute permission.',
      answers: ['chmod +x setup.sh', 'chmod u+x setup.sh', 'chmod a+x setup.sh'],
      hint: 'The file is not marked as runnable. Add that permission with a plus sign.',
      why: 'chmod +x sets the execute bit so the shell can run the script.',
      output: R`
student@MacBook ~ % ./setup.sh
Setting up workspace... done.`,
    },
    {
      id: 'm-chmod-3', os: 'macos', command: 'chmod', category: 'File management', style: 'scenario',
      q: 'A file of saved credentials, creds.txt, should be readable and writable by you only, with no access for the group or others. Type chmod using numeric permissions.',
      answers: ['chmod 600 creds.txt'],
      hint: 'Owner read+write (4+2); nothing for group or others.',
      why: 'rw------- is 600, which keeps other accounts on the Mac out of the file.',
      output: R`
student@MacBook ~ % ls -l creds.txt
-rw-------  1 student  staff  212 Nov 15 09:44 creds.txt`,
    },

    // ---- File management: chown ----
    {
      id: 'm-chown-1', os: 'macos', command: 'chown', category: 'File management', style: 'recall',
      q: 'Which command makes jlee the owner of handoff.txt? Type it with sudo, the user name, and the file.',
      answers: ['sudo chown jlee handoff.txt'],
      hint: 'Change the owner, not the permissions.',
      why: 'chown sets the file owner; giving a file to another user requires sudo.',
      output: R`
Password:
student@MacBook ~ % ls -l handoff.txt
-rw-r--r--  1 jlee  staff  1204 Nov 15 10:02 handoff.txt`,
    },
    {
      id: 'm-chown-2', os: 'macos', command: 'chown', category: 'File management', style: 'scenario',
      q: "After you migrated files with an admin account, user jlee cannot edit anything in /Users/jlee/Projects because root owns it all. Type the command with sudo that makes jlee the owner of that folder and everything inside it.",
      answers: ['sudo chown -R jlee /Users/jlee/Projects', 'sudo chown -R jlee:staff /Users/jlee/Projects', 'sudo chown -R jlee /Users/jlee/Projects/', 'sudo chown -R jlee:staff /Users/jlee/Projects/'],
      hint: 'Change ownership, and make it apply recursively to the whole folder.',
      why: 'chown -R jlee hands the folder and all its contents to jlee (staff is the usual macOS group).',
      output: R`
Password:
student@MacBook ~ % ls -ld /Users/jlee/Projects
drwxr-xr-x  9 jlee  staff  288 Nov 15 10:10 /Users/jlee/Projects`,
    },

    // ---- File management: grep ----
    {
      id: 'm-grep-1', os: 'macos', command: 'grep', category: 'File management', style: 'recall',
      q: 'Which command prints every line containing timeout in the file install.log? Type it with the pattern and file name.',
      answers: ['grep timeout install.log', 'grep "timeout" install.log', "grep 'timeout' install.log"],
      hint: 'Use the pattern search tool: the word first, then the file.',
      why: 'grep prints each matching line from the file.',
      output: R`
2026-11-15 09:02:14 installer: download timeout, retrying
2026-11-15 09:03:44 installer: download timeout, giving up`,
    },
    {
      id: 'm-grep-2', os: 'macos', command: 'grep', category: 'File management', style: 'scenario',
      q: 'You want to check whether /etc/hosts has an entry for intranet, but you are not sure if it was typed as Intranet or INTRANET. Type grep with the option that ignores case, the word intranet, and the file /etc/hosts.',
      answers: ['grep -i intranet /etc/hosts', 'grep -i "intranet" /etc/hosts', "grep -i 'intranet' /etc/hosts"],
      hint: 'The search tool is case-sensitive by default. One option turns that off.',
      why: 'grep -i matches any capitalization of the pattern.',
      output: R`
10.0.0.20	Intranet.corp.local Intranet`,
    },

    // ---- File management: find ----
    {
      id: 'm-find-1', os: 'macos', command: 'find', category: 'File management', style: 'recall',
      q: 'Which command searches /Applications for anything named Safari.app? Type it with the folder and the -name test.',
      answers: ['find /Applications -name Safari.app', 'find /Applications -name "Safari.app"', "find /Applications -name 'Safari.app'"],
      hint: 'Use the tool that walks a folder tree testing each item by name.',
      why: 'find walks the folder tree and prints each path whose name matches.',
      output: R`
/Applications/Safari.app`,
    },
    {
      id: 'm-find-2', os: 'macos', command: 'find', category: 'File management', style: 'scenario',
      q: 'A user\'s disk is filling up with old installer disk images. Find every .dmg file under your home folder: type find with ~ as the starting point and a -name test for "*.dmg" (keep the quotes).',
      answers: ['find ~ -name "*.dmg"', "find ~ -name '*.dmg'", 'find /Users/student -name "*.dmg"', "find /Users/student -name '*.dmg'"],
      hint: 'Search by a name pattern, starting at your home folder.',
      why: 'find lists every .dmg wherever it sits, so you can delete installers you no longer need.',
      output: R`
/Users/student/Downloads/googlechrome.dmg
/Users/student/Downloads/Zoom-6.2.5.dmg
/Users/student/Documents/old/Office-Installer-2021.dmg`,
    },

    // ---- Administrative: su ----
    {
      id: 'm-su-1', os: 'macos', command: 'su', category: 'Administrative', style: 'recall',
      q: "Which command switches your Terminal session to the user account jlee, using jlee's password? Type it with the user name.",
      answers: ['su jlee', 'su - jlee', 'su -l jlee'],
      hint: 'Substitute user, naming the account.',
      why: "su jlee switches to that account after you enter jlee's password.",
      output: R`
Password:
jlee@MacBook student %`,
    },
    {
      id: 'm-su-2', os: 'macos', command: 'su', category: 'Administrative', style: 'scenario',
      q: "A standard user's session can't run sudo, but you know the password of the local administrator account, admin. Without logging out, type the command that switches this Terminal session to the admin account.",
      answers: ['su admin', 'su - admin', 'su -l admin'],
      hint: "Switch your whole session to a different user, using that user's password.",
      why: "su admin switches to an administrator account (sudo only works for admins); macOS keeps root disabled, so you switch to an admin, not to root.",
      output: R`
Password:
admin@MacBook student %`,
    },

    // ---- Administrative: sudo ----
    {
      id: 'm-sudo-1', os: 'macos', command: 'sudo', category: 'Administrative', style: 'recall',
      q: 'On macOS, which command runs one command as root using your own administrator password? Type it to edit /etc/hosts with nano.',
      answers: ['sudo nano /etc/hosts'],
      hint: 'Prefix the command with "superuser do."',
      why: 'sudo elevates a single command; /etc/hosts is owned by root, so editing it needs sudo.',
      output: R`
Password:
  UW PICO 5.09                     File: /etc/hosts
##
# Host Database
##
127.0.0.1	localhost
255.255.255.255	broadcasthost
::1             localhost

^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell`,
    },
    {
      id: 'm-sudo-2', os: 'macos', command: 'sudo', category: 'Administrative', style: 'scenario',
      q: 'You tried "du -sh /private/var/db" and got "Permission denied" errors. Rather than retyping it, type the shortcut that reruns your previous command with root privileges.',
      answers: ['sudo !!'],
      hint: 'Elevate, then use the shell shortcut for "the last command" (two exclamation marks).',
      why: 'sudo !! repeats the previous command as root; !! expands to the last command.',
      output: R`
sudo du -sh /private/var/db
Password:
1.2G	/private/var/db`,
    },

    // ---- Network: ping ----
    {
      id: 'm-ping-1', os: 'macos', command: 'ping', category: 'Network', style: 'recall',
      q: 'On macOS, ping keeps going until Ctrl+C. Which command sends exactly 4 echo requests to 1.1.1.1? Type it with the count option.',
      answers: ['ping -c 4 1.1.1.1', 'ping -c4 1.1.1.1'],
      hint: 'The option stands for "count."',
      why: 'ping -c 4 stops after four packets and prints a summary.',
      output: R`
PING 1.1.1.1 (1.1.1.1): 56 data bytes
64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=11.402 ms
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=10.988 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=11.215 ms
64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=11.071 ms

--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 10.988/11.169/11.402/0.155 ms`,
    },
    {
      id: 'm-ping-2', os: 'macos', command: 'ping', category: 'Network', style: 'scenario',
      q: "A MacBook on Wi-Fi shows full bars but nothing loads. You want to check whether it can reach the router at 192.168.0.1. Type the reachability test with that address (no options; you'll stop it with Ctrl+C).",
      answers: ['ping 192.168.0.1'],
      hint: 'Start with the most basic ICMP test to the gateway.',
      why: 'If the gateway does not answer, the problem is the local network, not the internet or DNS.',
      output: R`
PING 192.168.0.1 (192.168.0.1): 56 data bytes
Request timeout for icmp_seq 0
Request timeout for icmp_seq 1
Request timeout for icmp_seq 2
^C
--- 192.168.0.1 ping statistics ---
4 packets transmitted, 0 packets received, 100.0% packet loss`,
    },

    // ---- Network: curl ----
    {
      id: 'm-curl-1', os: 'macos', command: 'curl', category: 'Network', style: 'recall',
      q: 'Which command (built into macOS) fetches https://example.com and prints the page in Terminal? Type it with that URL.',
      answers: ['curl https://example.com', 'curl https://example.com/'],
      hint: 'A command-line tool for transferring data from a URL.',
      why: 'curl requests the URL and prints the response body.',
      output: R`
<!doctype html>
<html>
<head>
    <title>Example Domain</title>
...
</html>`,
    },
    {
      id: 'm-curl-2', os: 'macos', command: 'curl', category: 'Network', style: 'scenario',
      q: 'Safari reports that https://status.corp.local is "not responding," but you want to see what HTTP status code the server actually returns. Type curl with the option that shows only the response headers.',
      answers: ['curl -I https://status.corp.local', 'curl --head https://status.corp.local', 'curl -I https://status.corp.local/'],
      hint: 'Ask for the headers only, with an uppercase letter option.',
      why: 'curl -I shows the status line (e.g. 503) and headers, telling you whether the server itself is failing.',
      output: R`
HTTP/2 503
date: Sun, 15 Nov 2026 11:12:40 GMT
content-type: text/html
retry-after: 120
server: nginx`,
    },

    // ---- Network: dig ----
    {
      id: 'm-dig-1', os: 'macos', command: 'dig', category: 'Network', style: 'recall',
      q: 'Which command queries DNS from the macOS Terminal and shows the full answer for apple.com? Type it with that domain.',
      answers: ['dig apple.com'],
      hint: 'Its name suggests digging into DNS.',
      why: 'dig prints the question, answer section, and which server responded.',
      output: R`
; <<>> DiG 9.10.6 <<>> apple.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 18803

;; ANSWER SECTION:
apple.com.		2420	IN	A	17.253.144.10

;; Query time: 18 msec
;; SERVER: 192.168.0.1#53(192.168.0.1)`,
    },
    {
      id: 'm-dig-2', os: 'macos', command: 'dig', category: 'Network', style: 'scenario',
      q: "A Mac can browse by IP address but not by name. You want to test whether Google's public DNS server can resolve example.net, bypassing the Mac's configured server. Type dig with @8.8.8.8 and the domain example.net.",
      answers: ['dig @8.8.8.8 example.net', 'dig example.net @8.8.8.8'],
      hint: 'Use the DNS query tool and name a specific server with an at sign.',
      why: 'dig @server sends the query to that server; if it answers but the default does not, the local DNS setting is the problem.',
      output: R`
; <<>> DiG 9.10.6 <<>> @8.8.8.8 example.net
;; ANSWER SECTION:
example.net.		300	IN	A	192.0.2.10

;; Query time: 22 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)`,
    },

    // ---- Network: traceroute ----
    {
      id: 'm-traceroute-1', os: 'macos', command: 'traceroute', category: 'Network', style: 'recall',
      q: 'Which macOS command shows each router hop between you and apple.com? Type it with that destination.',
      answers: ['traceroute apple.com'],
      hint: 'Trace the route, with the full word spelled out like Linux.',
      why: 'traceroute increases the TTL hop by hop to reveal every router on the path.',
      output: R`
traceroute to apple.com (17.253.144.10), 64 hops max, 40 byte packets
 1  192.168.0.1 (192.168.0.1)  2.114 ms  1.877 ms  1.902 ms
 2  10.64.0.1 (10.64.0.1)  9.408 ms  9.112 ms  9.240 ms
 3  isp-core1.example.net (198.51.100.9)  12.006 ms  11.874 ms  11.932 ms
 4  17.253.144.10 (17.253.144.10)  14.221 ms  14.098 ms  14.310 ms`,
    },
    {
      id: 'm-traceroute-2', os: 'macos', command: 'traceroute', category: 'Network', style: 'scenario',
      q: 'A remote designer on a Mac says video calls to the office server at 198.51.100.40 lag badly. You want to see the latency at each hop to spot where it jumps. Type the command with that address.',
      answers: ['traceroute 198.51.100.40'],
      hint: 'Ping gives one end-to-end number. You want a number for every hop.',
      why: 'traceroute shows the latency at each hop, so a sudden jump points to the slow link.',
      output: R`
traceroute to 198.51.100.40 (198.51.100.40), 64 hops max, 40 byte packets
 1  192.168.0.1 (192.168.0.1)  2.091 ms  1.944 ms  2.010 ms
 2  10.64.0.1 (10.64.0.1)  9.517 ms  9.320 ms  9.411 ms
 3  edge2.example.net (198.51.100.1)  188.402 ms  191.774 ms  186.950 ms
 4  198.51.100.40 (198.51.100.40)  190.118 ms  189.506 ms  192.004 ms`,
    },

    // ---- Informational: man ----
    {
      id: 'm-man-1', os: 'macos', command: 'man', category: 'Informational', style: 'recall',
      q: 'Which command opens the manual page for ls in the macOS Terminal? Type it with the command name.',
      answers: ['man ls'],
      hint: 'Short for "manual."',
      why: 'man ls shows the BSD ls options that macOS actually supports. Press q to quit.',
      output: R`
LS(1)                       General Commands Manual                      LS(1)

NAME
     ls – list directory contents

SYNOPSIS
     ls [-@ABCFGHILOPRSTUWabcdefghiklmnopqrstuvwxy1%,] [--color=when] [-D format] [file ...]
...`,
    },
    {
      id: 'm-man-2', os: 'macos', command: 'man', category: 'Informational', style: 'scenario',
      q: 'A Linux tutorial uses a find option that fails on your Mac, because macOS ships BSD versions of many tools. Type the command that shows the documentation for the find your Mac actually has.',
      answers: ['man find'],
      hint: 'The documentation installed on the Mac describes the version installed on the Mac.',
      why: 'The local man page documents the BSD find on macOS, including how its options differ from GNU find.',
      output: R`
FIND(1)                     General Commands Manual                    FIND(1)

NAME
     find – walk a file hierarchy

SYNOPSIS
     find [-H | -L | -P] [-EXdsx] [-f path] path ... [expression]
...`,
    },

    // ---- Informational: cat ----
    {
      id: 'm-cat-1', os: 'macos', command: 'cat', category: 'Informational', style: 'recall',
      q: 'Which command prints the contents of todo.txt to the Terminal? Type it with the file name.',
      answers: ['cat todo.txt'],
      hint: 'Short for "concatenate," it prints whole files.',
      why: 'cat writes the file straight to the terminal.',
      output: R`
- Renew Apple Developer membership
- Back up with Time Machine before upgrading macOS
- Clear old .dmg installers`,
    },
    {
      id: 'm-cat-2', os: 'macos', command: 'cat', category: 'Informational', style: 'scenario',
      q: "You suspect adware added entries to the Mac's hosts file to redirect websites. Type the command that prints /etc/hosts so you can read it.",
      answers: ['cat /etc/hosts'],
      hint: 'Just display the whole file; no editing yet.',
      why: 'cat shows the whole file so you can spot suspicious entries before editing them with sudo.',
      output: R`
##
# Host Database
##
127.0.0.1	localhost
255.255.255.255	broadcasthost
::1             localhost
203.0.113.66	www.google.com`,
    },

    // ---- Informational: top ----
    {
      id: 'm-top-1', os: 'macos', command: 'top', category: 'Informational', style: 'recall',
      q: 'Which command shows a live, updating view of processes and CPU and memory use in the macOS Terminal? (No options.)',
      answers: ['top'],
      hint: "It's the Terminal's answer to Activity Monitor.",
      why: 'top refreshes continuously with load, memory, and per-process usage. Press q to quit.',
      output: R`
Processes: 512 total, 3 running, 509 sleeping, 2541 threads            11:20:14
Load Avg: 2.91, 2.04, 1.77  CPU usage: 38.12% user, 9.40% sys, 52.47% idle
PhysMem: 15G used (2.1G wired, 3.0G compressor), 640M unused.

PID    COMMAND      %CPU  TIME     #TH   #WQ  #PORT MEM    PURG   CMPRS
812    WindowServer 22.4  31:02.11 24    6    3014  812M   12M    140M
5120   Google Chrome 18.9 12:40.55 41    2    891   1.2G   0B     310M
0      kernel_task  9.7   20:11.40 512/12 0   0     12M    0B     0B`,
    },
    {
      id: 'm-top-2', os: 'macos', command: 'top', category: 'Informational', style: 'scenario',
      q: "A Mac's fans are roaring, and the user is connected by SSH only, so Activity Monitor isn't an option. Type top with the option that sorts the live process list by CPU usage.",
      answers: ['top -o cpu'],
      hint: 'On macOS, the live process viewer takes an "order by" option followed by the column.',
      why: 'top -o cpu puts the heaviest CPU users first, so the cause of the fan noise is at the top.',
      output: R`
Processes: 498 total, 4 running, 494 sleeping, 2412 threads            11:24:51
Load Avg: 6.12, 4.80, 3.02  CPU usage: 81.40% user, 6.22% sys, 12.37% idle

PID    COMMAND      %CPU  TIME     #TH   #WQ  #PORT MEM    PURG   CMPRS
6012   mdworker_sha 96.1  04:12.88 4     1    61    44M    0B     0B
5120   Google Chrome 41.0 12:58.02 41    2    891   1.2G   0B     310M
812    WindowServer 12.3  31:20.47 24    6    3014  812M   12M    140M`,
    },

    // ---- Informational: ps ----
    {
      id: 'm-ps-1', os: 'macos', command: 'ps', category: 'Informational', style: 'recall',
      q: 'Which command lists a one-time snapshot of every process on the Mac, for all users, with owner and PID? Type ps with the options for that (either common style is accepted).',
      answers: ['ps aux', 'ps -ef', 'ps -A', 'ps -e', 'ps -ax', 'ps ax'],
      hint: 'The process-status command shows only your own terminal by default. Add options for everyone.',
      why: 'ps aux (or ps -ef) lists all processes with their owners and PIDs.',
      output: R`
USER       PID  %CPU %MEM      VSZ    RSS   TT  STAT STARTED      TIME COMMAND
_windowserver   812  22.4  5.1 413201344 830112   ??  Ss   Wed09AM  31:02.11 /System/Library/PrivateFrameworks/SkyLight.framework/...
student   5120  18.9  7.4 419330656 1213440  ??  S    10:02AM  12:40.55 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
root         1   0.0  0.1 410718352  18016   ??  Ss   Wed09AM   2:10.42 /sbin/launchd`,
    },
    {
      id: 'm-ps-2', os: 'macos', command: 'ps', category: 'Informational', style: 'scenario',
      q: 'You started a long-running script from this Terminal window and need its PID so you can stop it. Type the snapshot command that lists only this terminal session\'s processes (no options).',
      answers: ['ps'],
      hint: 'A one-time snapshot, not a live view. With no options, it shows only your terminal.',
      why: 'Plain ps lists processes attached to your terminal, with their PIDs for use with kill.',
      output: R`
  PID TTY           TIME CMD
 4410 ttys000    0:00.08 -zsh
 4521 ttys000    3:12.40 python3 sync_photos.py`,
    },

    // ---- Informational: du ----
    {
      id: 'm-du-1', os: 'macos', command: 'du', category: 'Informational', style: 'recall',
      q: 'Which command shows the total size of the /Applications folder as one human-readable number? Type it with the summary and human-readable options.',
      answers: ['du -sh /Applications', 'du -hs /Applications', 'du -s -h /Applications', 'du -h -s /Applications', 'du -sh /Applications/'],
      hint: 'Disk usage, summarized, in human units.',
      why: 'du -sh totals everything in the folder and prints it in K/M/G.',
      output: R`
 38G	/Applications`,
    },
    {
      id: 'm-du-2', os: 'macos', command: 'du', category: 'Informational', style: 'scenario',
      q: "A user's startup disk is almost full. You suspect app caches in their Library folder. Type du with the summary and human-readable options for ~/Library/Caches.",
      answers: ['du -sh ~/Library/Caches', 'du -hs ~/Library/Caches', 'du -s -h ~/Library/Caches', 'du -h -s ~/Library/Caches', 'du -sh /Users/student/Library/Caches', 'du -sh ~/Library/Caches/'],
      hint: 'Measure how much space one folder uses, summarized and in human units.',
      why: 'du -sh shows how much one folder consumes, confirming whether caches are the space hog.',
      output: R`
 21G	/Users/student/Library/Caches`,
    },

    // ---- Informational: df ----
    {
      id: 'm-df-1', os: 'macos', command: 'df', category: 'Informational', style: 'recall',
      q: 'Which command shows used and available space on every mounted volume in human-readable units? Type it with that option.',
      answers: ['df -h'],
      hint: 'Disk free, in human units.',
      why: 'df -h lists each mounted volume with size, used, available, and capacity.',
      output: R`
Filesystem        Size    Used   Avail Capacity iused ifree %iused  Mounted on
/dev/disk3s1s1   460Gi    11Gi   38Gi    23%    426k  398M    0%   /
/dev/disk3s6     460Gi   2.0Gi   38Gi     5%       2  398M    0%   /System/Volumes/VM
/dev/disk3s5     460Gi   405Gi   38Gi    92%    2.1M  398M    1%   /System/Volumes/Data`,
    },
    {
      id: 'm-df-2', os: 'macos', command: 'df', category: 'Informational', style: 'scenario',
      q: 'A macOS update fails with "not enough free space." You want to see how much space is left on the startup volume and any external drives. Type the command with the human-readable option.',
      answers: ['df -h'],
      hint: 'You want free space per volume, not the size of one folder.',
      why: 'df -h shows how full each volume is, so you know how much must be cleared for the update.',
      output: R`
Filesystem        Size    Used   Avail Capacity  Mounted on
/dev/disk3s1s1   228Gi    11Gi  4.1Gi    73%    /
/dev/disk3s5     228Gi   209Gi  4.1Gi    99%    /System/Volumes/Data
/dev/disk5s1     1.8Ti   1.1Ti  712Gi    62%    /Volumes/Backup`,
    },

    // ---- Text editor: nano ----
    {
      id: 'm-nano-1', os: 'macos', command: 'nano', category: 'Text editor', style: 'recall',
      q: 'Which simple terminal editor, with its shortcuts shown at the bottom of the screen, opens ~/.zshrc for editing? Type it with that path.',
      answers: ['nano ~/.zshrc', 'nano .zshrc', 'nano /Users/student/.zshrc'],
      hint: 'A beginner-friendly editor whose name sounds tiny.',
      why: 'nano opens the file for editing; Ctrl+O saves and Ctrl+X exits.',
      output: R`
  UW PICO 5.09                     File: /Users/student/.zshrc
export PATH="$HOME/bin:$PATH"
alias ll="ls -la"

^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell`,
    },
    {
      id: 'm-nano-2', os: 'macos', command: 'nano', category: 'Text editor', style: 'scenario',
      q: 'Over SSH (no Finder, no TextEdit), you need to fix a typo in /Users/student/Desktop/readme.txt. The user has never used vim. Type the beginner-friendly editor command with that path.',
      answers: ['nano /Users/student/Desktop/readme.txt', 'nano ~/Desktop/readme.txt'],
      hint: 'Choose the terminal editor that lists its shortcut keys on screen.',
      why: 'nano is the easiest terminal editor: no modes, and its shortcuts are always visible.',
      output: R`
  UW PICO 5.09                     File: /Users/student/Desktop/readme.txt
Welcome to the team! Your first-week checklist is below.

^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell`,
    },
  ];

  const bank = { info: INFO, questions: QUESTIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = bank;
  else root.QUESTION_BANK = bank;
})(typeof window !== 'undefined' ? window : globalThis);
