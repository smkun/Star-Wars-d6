# Manual Server Start Guide

## Preferred Solution: Use app.js Wrapper

**RECOMMENDED**: Instead of manual SSH commands, use the Passenger entry point wrapper:

1. Ensure `app.js` exists in your application root (`/home/gamers/nodejs/star-wars-api/app.js`)
2. Set **Application Startup File** to `app.js` in iFastNet Node.js control panel
3. Click **Restart** - Passenger will automatically load the server

**Contents of app.js**:
```javascript
// Passenger entry point wrapper
require('./api/run-local-server.js');
```

This allows Passenger to manage the server lifecycle automatically.

---

## Fallback: Manual Start Process

**Problem**: iFastNet's Node.js control panel "Restart" button doesn't work properly when pointing directly to `api/run-local-server.js` - the server only starts if you run it manually via SSH.

**Solution**: Use manual SSH commands below

### Step 1: SSH and Activate Environment

```bash
ssh gamers@your-server.ifastnet.com
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api
```

### Step 2: Check if Server is Already Running

```bash
ps aux | grep "node.*run-local-server"
```

**If running**: You'll see a line like:
```
gamers   12345  0.0  1.2  /path/to/node api/run-local-server.js
```

**To kill it** (if you need to restart):
```bash
pkill -f "node.*run-local-server"
```

Or kill by PID:
```bash
kill 12345  # Replace with actual PID from ps output
```

### Step 3: Start Server Manually

**Option A: Foreground (for testing)**

```bash
node api/run-local-server.js
```

This runs the server in the foreground. You'll see:
```
Local API listening on 4000
```

**Problem**: Your SSH session must stay open. If you disconnect, server stops.

**Option B: Background with nohup (RECOMMENDED)**

```bash
nohup node api/run-local-server.js > /dev/null 2>&1 &
```

This:
- Runs server in background
- Ignores hangup signals (keeps running after SSH disconnect)
- Redirects output to /dev/null (or you can specify a log file)
- Returns immediately so you can continue using SSH

**To save logs instead**:
```bash
nohup node api/run-local-server.js > server.log 2>&1 &
```

**Option C: Background with screen (if available)**

```bash
screen -dmS star-wars-api node api/run-local-server.js
```

To reattach and see output:
```bash
screen -r star-wars-api
```

To detach: Press `Ctrl+A` then `D`

**Option D: Background with tmux (if available)**

```bash
tmux new-session -d -s star-wars-api 'node api/run-local-server.js'
```

To attach and see output:
```bash
tmux attach -t star-wars-api
```

To detach: Press `Ctrl+B` then `D`

### Step 4: Verify Server is Running

```bash
# Check process
ps aux | grep "node.*run-local-server"

# Check if port is listening
lsof -i :4000  # Or whatever port your app uses
# OR
netstat -tlnp | grep :4000

# Test endpoint (from server)
curl http://localhost:4000/species | head -20
```

### Step 5: Test from Outside

From your local machine:

```bash
curl https://yourdomain.com/api/species
```

Should return JSON array of species.

## Quick Start Commands

### Complete Manual Start Sequence

Copy and paste this entire block:

```bash
# 1. Activate environment
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api

# 2. Kill any existing server
pkill -f "node.*run-local-server" 2>/dev/null

# 3. Start server in background
nohup node api/run-local-server.js > server.log 2>&1 &

# 4. Wait a moment for startup
sleep 2

# 5. Verify it's running
ps aux | grep "node.*run-local-server" | grep -v grep && echo "✅ Server is running"

# 6. Test locally
curl -s http://localhost:4000/species | head -20

# 7. Show last few log lines
tail -5 server.log

# 8. Deactivate environment
deactivate

# 9. You can now exit SSH - server will keep running
exit
```

## Checking Server Status

### Is the server running?

```bash
ps aux | grep "node.*run-local-server" | grep -v grep
```

**Output if running**:
```
gamers   12345  0.1  1.2  /path/to/node api/run-local-server.js
```

**Output if NOT running**:
```
(no output)
```

### What port is it using?

```bash
lsof -i -P | grep node
```

**Output**:
```
node    12345 gamers   18u  IPv6  0x123456      0t0  TCP *:4000 (LISTEN)
```

Shows server listening on port 4000.

### View server logs

If you started with log file:

```bash
tail -f server.log
```

Press `Ctrl+C` to stop following.

## Stopping the Server

### Stop gently

```bash
pkill -f "node.*run-local-server"
```

### Force stop (if gentle doesn't work)

```bash
pkill -9 -f "node.*run-local-server"
```

### Stop by PID

```bash
# Find PID
ps aux | grep "node.*run-local-server"

# Kill by PID
kill 12345  # Replace with actual PID
```

## After Deployment

### Complete Restart Sequence

After deploying new code or updating dependencies:

```bash
# 1. SSH and activate
ssh gamers@your-server.ifastnet.com
source /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/activate && cd /home/gamers/nodejs/star-wars-api

# 2. Stop old server
pkill -f "node.*run-local-server"

# 3. Wait for it to stop
sleep 2

# 4. Install dependencies (if package.json changed)
npm install --production

# 5. Start new server
nohup node api/run-local-server.js > server.log 2>&1 &

# 6. Verify startup
sleep 2
tail -10 server.log

# 7. Test
curl -s http://localhost:4000/species | head -20
```

## Troubleshooting

### Server won't start

**Check for errors**:
```bash
node api/run-local-server.js
```

Common errors:
- **Cannot find module**: Run `npm install --production`
- **Port already in use**: Kill existing process first
- **Environment variables missing**: Check `.env` exists
- **Firebase credentials error**: Check `GOOGLE_APPLICATION_CREDENTIALS` path

### Server stops randomly

**Check system memory**:
```bash
free -h
```

**Check if OOM killer is involved**:
```bash
dmesg | grep -i "killed process"
```

If memory issues, reduce other processes or upgrade hosting.

### Can't connect to server from outside

**Check firewall**:
```bash
# If you have access
sudo iptables -L -n | grep 4000
```

**Check Apache/NGINX proxy**:
- Make sure web server is proxying `/api` to Node.js port
- Check `.htaccess` or NGINX config

**Check CORS settings**:
- Verify `ALLOWED_ORIGIN` in `.env` matches your domain

## Auto-Start on Boot (Optional)

If you want server to start automatically after server reboot:

### Option 1: Add to crontab

```bash
crontab -e
```

Add this line:
```
@reboot cd /home/gamers/nodejs/star-wars-api && /home/gamers/nodevenv/nodejs/star-wars-api/20/bin/node api/run-local-server.js > server.log 2>&1 &
```

### Option 2: Create systemd service (if you have sudo)

Create `/etc/systemd/system/star-wars-api.service`:

```ini
[Unit]
Description=Star Wars d6 API
After=network.target

[Service]
Type=simple
User=gamers
WorkingDirectory=/home/gamers/nodejs/star-wars-api
Environment="PATH=/home/gamers/nodevenv/nodejs/star-wars-api/20/bin:/usr/bin:/bin"
ExecStart=/home/gamers/nodevenv/nodejs/star-wars-api/20/bin/node api/run-local-server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/gamers/nodejs/star-wars-api/server.log
StandardError=append:/home/gamers/nodejs/star-wars-api/server.log

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable star-wars-api
sudo systemctl start star-wars-api
sudo systemctl status star-wars-api
```

## Summary

**Problem**: iFastNet control panel restart doesn't work

**Solution**: Manually start via SSH with:
```bash
nohup node api/run-local-server.js > server.log 2>&1 &
```

**Best Practice**:
- Use `nohup` with `&` for background operation
- Save logs to `server.log` for debugging
- Check with `ps aux | grep node` before starting again
- Test with `curl` after starting

**After every deployment**:
1. Kill old server: `pkill -f "node.*run-local-server"`
2. Start new server: `nohup node api/run-local-server.js > server.log 2>&1 &`
3. Verify: `curl http://localhost:4000/species`
